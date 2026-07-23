import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';

import {
  DocumentRegistry,
  ArazzoDocument,
  WorkflowExecutor,
  StepExecutor,
  OpenAPIOperationExecutor,
  OpenAPIClient,
  OpenAPIOperationResponse,
  ExecutionError,
  type OpenAPIOperationExecuteOptions,
} from '../../src/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, '..', 'fixtures');
const entryPath = path.join(fixturesPath, 'workflow-control-flow.arazzo.yaml');

/**
 * A stub client that records the execute options it receives and returns canned
 * responses in sequence — deterministic, no network. Call N gets `sequence[N]`;
 * once the list is exhausted every further call repeats the last entry, so a
 * single-element sequence is a constant response and a longer one drives "fails
 * twice, then succeeds".
 */
class StubClient extends OpenAPIClient {
  constructor(
    document: ConstructorParameters<typeof OpenAPIClient>[0],
    readonly sequence: readonly ConstructorParameters<typeof OpenAPIOperationResponse>[0][],
    readonly calls: OpenAPIOperationExecuteOptions[],
  ) {
    super(document);
  }

  async execute(options: OpenAPIOperationExecuteOptions): Promise<OpenAPIOperationResponse> {
    const canned = this.sequence[Math.min(this.calls.length, this.sequence.length - 1)];
    this.calls.push(options);
    return new OpenAPIOperationResponse(canned);
  }
}

type CannedResponse = ConstructorParameters<typeof OpenAPIOperationResponse>[0];

const okResponse: CannedResponse = {
  ok: true,
  url: 'x',
  status: 200,
  statusText: 'OK',
  headers: {},
  text: '',
  body: { id: 7, name: 'Rex' },
};
const serverErrorResponse: CannedResponse = {
  ok: false,
  url: 'x',
  status: 500,
  statusText: 'Internal Server Error',
  headers: {},
  text: '',
  body: {},
};

/**
 * Asserts a promise rejects with the given error type and message — a local
 * stand-in for chai-as-promised, which the package does not depend on.
 */
const rejects = async (
  promise: Promise<unknown>,
  errorType?: typeof ExecutionError,
  message?: RegExp,
): Promise<void> => {
  try {
    await promise;
  } catch (error) {
    if (errorType !== undefined) assert.instanceOf(error, errorType);
    if (message !== undefined) assert.match((error as Error).message, message);
    return;
  }
  assert.fail('expected promise to reject, but it resolved');
};

describe('WorkflowExecutor', function () {
  let registry: DocumentRegistry;
  let entry: ArazzoDocument;

  before(async function () {
    registry = new DocumentRegistry();
    entry = await registry.acquireEntryDocument(entryPath);
  });

  /**
   * Builds a step executor whose stub client returns `sequence` responses in
   * order, recording the client calls (in execution order) into `calls`.
   */
  const makeStepExecutor = (
    sequence: readonly CannedResponse[],
    calls: OpenAPIOperationExecuteOptions[],
  ): StepExecutor =>
    new StepExecutor({
      document: entry,
      registry,
      operationExecutor: new OpenAPIOperationExecutor({
        clientFactory: (document) => new StubClient(document, sequence, calls),
      }),
    });

  /**
   * Builds a workflow executor whose client returns `responses` in sequence,
   * exposing the recorded client `calls` and the `sleeps` its (no-op) retry
   * timer was asked to wait — so retry behavior is deterministic and `retryAfter`
   * timing is assertable without real waiting. A single response is a constant;
   * a longer sequence drives retry ("fails twice, then succeeds").
   */
  const makeExecutor = (
    responses: CannedResponse | readonly CannedResponse[] = okResponse,
    options: { maxSteps?: number } = {},
  ): {
    executor: WorkflowExecutor;
    calls: OpenAPIOperationExecuteOptions[];
    sleeps: number[];
  } => {
    const sequence = Array.isArray(responses) ? responses : [responses as CannedResponse];
    const calls: OpenAPIOperationExecuteOptions[] = [];
    const sleeps: number[] = [];
    const executor = new WorkflowExecutor({
      document: entry,
      registry,
      stepExecutor: makeStepExecutor(sequence, calls),
      sleep: async (ms) => {
        sleeps.push(ms);
      },
      ...options,
    });
    return { executor, calls, sleeps };
  };

  context('linear flow', function () {
    specify('should run steps in list order and flow outputs step to step', async function () {
      const { executor, calls } = makeExecutor();

      const result = await executor.execute('linear', { status: 'available' });

      assert.strictEqual(result.workflowId, 'linear');
      assert.strictEqual(result.status, 'completed');
      // both steps ran, in order.
      assert.deepEqual(
        result.steps.map((step) => step.stepId),
        ['findPets', 'getPet'],
      );
      assert.isTrue(result.steps.every((step) => step.successful));
      // getPet's petId parameter came from findPets' resolved output.
      assert.strictEqual(calls.length, 2);
      assert.deepEqual(calls[1].parameters, { petId: 7 });
      // workflow outputs resolved against the final state.
      assert.deepEqual(result.outputs, { name: 'Rex', id: 7 });
    });

    specify('should complete a workflow with no steps as a no-op', async function () {
      const { executor, calls } = makeExecutor();

      const result = await executor.execute('emptyWorkflow');

      assert.strictEqual(result.status, 'completed');
      assert.deepEqual(result.steps, []);
      assert.strictEqual(calls.length, 0);
      assert.deepEqual(result.outputs, {});
    });
  });

  context('goto', function () {
    specify('should jump to the target step, skipping steps in between', async function () {
      const { executor, calls } = makeExecutor();

      const result = await executor.execute('gotoStep');

      assert.strictEqual(result.status, 'completed');
      // first gotos third; second is skipped entirely.
      assert.deepEqual(
        result.steps.map((step) => step.stepId),
        ['first', 'third'],
      );
      assert.strictEqual(calls.length, 2);
      assert.isUndefined(result.outputs.secondRan);
      assert.strictEqual(result.outputs.thirdReached, 200);
    });

    specify('should throw goto-target-not-found for an unknown target step', async function () {
      const { executor } = makeExecutor();

      await rejects(
        executor.execute('gotoMissing'),
        ExecutionError,
        /goto target step "nonexistent"/,
      );
    });

    specify('should bound an infinite goto by the step budget', async function () {
      const { executor } = makeExecutor(okResponse, { maxSteps: 5 });

      await rejects(executor.execute('infiniteGoto'), ExecutionError, /step budget of 5/);
    });
  });

  context('stop conditions', function () {
    specify('should stop early on an end action with status "ended"', async function () {
      const { executor, calls } = makeExecutor();

      const result = await executor.execute('endEarly');

      assert.strictEqual(result.status, 'ended');
      // only the first step ran; the end action stopped the run.
      assert.deepEqual(
        result.steps.map((step) => step.stepId),
        ['first'],
      );
      assert.strictEqual(calls.length, 1);
      // outputs so far are returned; the un-run step's output is absent.
      assert.strictEqual(result.outputs.first, 200);
      assert.isUndefined(result.outputs.second);
    });

    specify(
      'should break with status "failed" when a step fails and has no onFailure',
      async function () {
        // every client returns a 500, so the first step's successCriteria fail.
        const { executor, calls } = makeExecutor(serverErrorResponse);

        const result = await executor.execute('failBreak');

        assert.strictEqual(result.status, 'failed');
        assert.deepEqual(
          result.steps.map((step) => step.stepId),
          ['doomed'],
        );
        assert.isFalse(result.steps[0].successful);
        // the second step never executed.
        assert.strictEqual(calls.length, 1);
        assert.isUndefined(result.outputs.neverRan);
      },
    );
  });

  context('workflow-level default actions', function () {
    specify(
      'should apply workflow failureActions to a step that declares no onFailure',
      async function () {
        // the step fails (500) and has no onFailure, so it inherits the
        // workflow-level failureActions (end); the run ends, not breaks.
        const { executor, calls } = makeExecutor(serverErrorResponse);

        const result = await executor.execute('inheritsFailureActions');

        assert.strictEqual(result.status, 'ended');
        assert.deepEqual(
          result.steps.map((step) => step.stepId),
          ['only'],
        );
        // the inherited end action was selected for the failing step.
        assert.strictEqual(calls.length, 1);
      },
    );

    specify(
      "should let a step's own onFailure override the workflow failureActions wholesale",
      async function () {
        // the step fails (500) but its own onFailure gotos a recovery step; the
        // workflow-level end is not applied.
        const { executor, calls } = makeExecutor(serverErrorResponse);

        const result = await executor.execute('overridesFailureActions');

        assert.strictEqual(result.status, 'completed');
        assert.deepEqual(
          result.steps.map((step) => step.stepId),
          ['failing', 'recovery'],
        );
        assert.strictEqual(calls.length, 2);
      },
    );

    specify(
      'should apply workflow successActions to a step that declares no onSuccess',
      async function () {
        // the first step succeeds and, having no onSuccess, inherits the
        // workflow-level successActions (end); the second step never runs.
        const { executor, calls } = makeExecutor();

        const result = await executor.execute('inheritsSuccessActions');

        assert.strictEqual(result.status, 'ended');
        assert.deepEqual(
          result.steps.map((step) => step.stepId),
          ['first'],
        );
        assert.strictEqual(calls.length, 1);
        assert.strictEqual(result.outputs.first, 200);
        assert.isUndefined(result.outputs.second);
      },
    );

    specify(
      'should let an empty step onSuccess suppress the workflow successActions',
      async function () {
        // the first step declares onSuccess: [] — an explicit empty list, not an
        // absent one — which overrides the workflow "end" wholesale. The run must
        // proceed to the second step rather than ending early.
        const { executor, calls } = makeExecutor();

        const result = await executor.execute('emptyOnSuccessSuppressesDefault');

        assert.strictEqual(result.status, 'completed');
        assert.deepEqual(
          result.steps.map((step) => step.stepId),
          ['first', 'second'],
        );
        assert.strictEqual(calls.length, 2);
        assert.strictEqual(result.outputs.second, 200);
      },
    );

    specify('should fall back to success and failure defaults independently', async function () {
      // the step overrides onSuccess (goto third) but declares no onFailure. On
      // success its own goto wins — skipping the second step — while the
      // workflow-level failureActions remain available but unused here.
      const { executor, calls } = makeExecutor();

      const result = await executor.execute('overrideSuccessInheritFailure');

      assert.strictEqual(result.status, 'completed');
      assert.deepEqual(
        result.steps.map((step) => step.stepId),
        ['first', 'third'],
      );
      assert.strictEqual(calls.length, 2);
      assert.isUndefined(result.outputs.second);
      assert.strictEqual(result.outputs.third, 200);
    });
  });

  context('malformed control flow', function () {
    specify(
      'should throw for a goto action naming neither stepId nor workflowId',
      async function () {
        const { executor } = makeExecutor();

        await rejects(
          executor.execute('gotoNoTarget'),
          ExecutionError,
          /has neither stepId nor workflowId/,
        );
      },
    );

    specify('should throw for an action with an unknown type', async function () {
      const { executor } = makeExecutor();

      await rejects(
        executor.execute('unknownActionType'),
        ExecutionError,
        /has unsupported type "teleport"/,
      );
    });

    specify('should throw for a present but non-list "steps"', async function () {
      // a malformed steps is an authoring error, not a silent no-op run.
      const { executor } = makeExecutor();

      await rejects(executor.execute('scalarSteps'), ExecutionError, /non-list "steps"/);
    });
  });

  context('retry', function () {
    specify('should retry a failing step until it succeeds', async function () {
      // fails twice (500), then succeeds (200) — within a retryLimit of 3.
      const { executor, calls, sleeps } = makeExecutor([
        serverErrorResponse,
        serverErrorResponse,
        okResponse,
      ]);

      const result = await executor.execute('retryThenSucceed');

      assert.strictEqual(result.status, 'completed');
      // 3 attempts: initial + 2 retries.
      assert.strictEqual(calls.length, 3);
      assert.strictEqual(result.steps[0].attempts, 3);
      assert.isTrue(result.steps[0].successful);
      // slept before each of the 2 retries, retryAfter: 2s → 2000ms.
      assert.deepEqual(sleeps, [2000, 2000]);
      assert.strictEqual(result.outputs.status, 200);
    });

    specify('should default retryLimit to 1 when unset, without sleeping', async function () {
      // getInventory always 500; retry has no retryLimit → a single retry, and
      // no retryAfter → no sleep (not even a sleep(0) event-loop yield).
      const { executor, calls, sleeps } = makeExecutor([serverErrorResponse]);

      const result = await executor.execute('retryDefaultLimit');

      // initial + 1 default retry = 2 attempts, then break-default.
      assert.strictEqual(calls.length, 2);
      assert.strictEqual(result.steps[0].attempts, 2);
      assert.strictEqual(result.status, 'failed');
      assert.deepEqual(sleeps, []); // no retryAfter → sleep never called
    });

    specify('should proceed to the following step after a retry succeeds', async function () {
      // flaky fails once (500) then succeeds (200); control must continue to the
      // `after` step rather than stopping at the recovered retry.
      const { executor } = makeExecutor([serverErrorResponse, okResponse]);

      const result = await executor.execute('retryThenSucceedThenNext');

      assert.strictEqual(result.status, 'completed');
      assert.deepEqual(
        result.steps.map((step) => step.stepId),
        ['flaky', 'after'],
      );
      assert.strictEqual(result.steps[0].attempts, 2); // flaky: initial + 1 retry
      assert.strictEqual(result.steps[1].attempts, 1); // after: ran once
      assert.strictEqual(result.outputs.after, 200);
    });

    specify('should count retry attempts against the step budget', async function () {
      // retryExhaustedThenBreak retries a persistent 500 (retryLimit 2 → 3
      // attempts); a maxSteps of 2 must halt it via the step-budget guard,
      // proving retries are bounded, not just outer step entries.
      const { executor } = makeExecutor([serverErrorResponse], { maxSteps: 2 });

      await rejects(
        executor.execute('retryExhaustedThenBreak'),
        ExecutionError,
        /exceeded the step budget of 2/,
      );
    });

    specify('should exhaust retries before firing a subsequent failure action', async function () {
      // always 500: retry (limit 2) is exhausted, then the subsequent end fires.
      const { executor, calls, sleeps } = makeExecutor([serverErrorResponse]);

      const result = await executor.execute('retryExhaustedThenEnd');

      assert.strictEqual(result.status, 'ended');
      // initial + 2 retries = 3 attempts on the doomed step; unreached never ran.
      assert.strictEqual(calls.length, 3);
      assert.deepEqual(
        result.steps.map((step) => step.stepId),
        ['doomed'],
      );
      assert.strictEqual(result.steps[0].attempts, 3);
      assert.deepEqual(sleeps, [1000, 1000]);
    });

    specify(
      'should fall to the break-default when retries exhaust with no next action',
      async function () {
        const { executor } = makeExecutor([serverErrorResponse]);

        const result = await executor.execute('retryExhaustedThenBreak');

        assert.strictEqual(result.status, 'failed');
        assert.strictEqual(result.steps[0].attempts, 3); // initial + 2 retries
        assert.isFalse(result.steps[0].successful);
      },
    );

    specify('should give each retry in a chain its own independent budget', async function () {
      // always 500: retryFast (limit 2) exhausts, then retrySlow (limit 3)
      // exhausts on its own budget, then the terminal end fires.
      const { executor, calls, sleeps } = makeExecutor([serverErrorResponse]);

      const result = await executor.execute('retryChainIndependentBudgets');

      assert.strictEqual(result.status, 'ended');
      // initial + 2 (fast) + 3 (slow) = 6 attempts.
      assert.strictEqual(calls.length, 6);
      assert.strictEqual(result.steps[0].attempts, 6);
      // 2 fast delays (1s) then 3 slow delays (5s).
      assert.deepEqual(sleeps, [1000, 1000, 5000, 5000, 5000]);
    });
  });

  context('step executor injection', function () {
    specify('should delegate steps to the injected stepExecutor', async function () {
      const calls: OpenAPIOperationExecuteOptions[] = [];
      const executor = new WorkflowExecutor({
        document: entry,
        registry,
        stepExecutor: makeStepExecutor([okResponse], calls),
      });

      const result = await executor.execute('linear', { status: 'available' });

      assert.strictEqual(result.status, 'completed');
      assert.strictEqual(calls.length, 2);
    });
  });

  context('authoring errors', function () {
    specify('should throw workflow-not-found for an unknown workflowId', async function () {
      const { executor } = makeExecutor();

      await rejects(executor.execute('noSuchWorkflow'), ExecutionError, /not found/);
    });
  });

  context('not yet supported', function () {
    specify('should throw for a goto targeting a workflowId', async function () {
      const { executor } = makeExecutor();

      await rejects(
        executor.execute('gotoWorkflowUnsupported'),
        ExecutionError,
        /gotos a workflowId; not supported yet/,
      );
    });

    specify('should throw for a retry carrying a stepId/workflowId reference', async function () {
      // the 500 makes the step fail so its onFailure retry (with a stepId
      // reference) is selected — the reference form is not yet supported.
      const { executor } = makeExecutor([serverErrorResponse]);

      await rejects(
        executor.execute('retryWithReference'),
        ExecutionError,
        /carries a stepId\/workflowId reference; not supported yet/,
      );
    });

    specify('should throw for a sub-workflow (workflowId) step', async function () {
      const { executor } = makeExecutor();

      await rejects(
        executor.execute('subWorkflowStep'),
        ExecutionError,
        /targets a sub-workflow; not supported yet/,
      );
    });
  });
});
