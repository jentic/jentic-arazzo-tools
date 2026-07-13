import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { refractStep, type StepElement } from '@speclynx/apidom-ns-arazzo-1';

import {
  DocumentRegistry,
  ArazzoDocument,
  StepExecutor,
  WorkflowExecutionState,
  OpenAPIClient,
  OpenAPIOperationResponse,
  ExecutionError,
  type OpenAPIOperationExecuteOptions,
} from '../../src/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, '..', 'fixtures');
const entryPath = path.join(fixturesPath, 'petstore-order-workflow.arazzo.yaml');

/**
 * A stub client that records the execute options it receives and returns a
 * canned response — deterministic, no network.
 */
class StubClient extends OpenAPIClient {
  readonly calls: OpenAPIOperationExecuteOptions[] = [];

  constructor(
    document: ConstructorParameters<typeof OpenAPIClient>[0],
    readonly canned: ConstructorParameters<typeof OpenAPIOperationResponse>[0],
  ) {
    super(document);
  }

  async execute(options: OpenAPIOperationExecuteOptions): Promise<OpenAPIOperationResponse> {
    this.calls.push(options);
    return new OpenAPIOperationResponse(this.canned);
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
  body: [{ id: 7 }],
};
const notFoundResponse: CannedResponse = {
  ok: false,
  url: 'x',
  status: 404,
  statusText: 'Not Found',
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

describe('StepExecutor', function () {
  let registry: DocumentRegistry;
  let entry: ArazzoDocument;

  before(async function () {
    registry = new DocumentRegistry();
    entry = await registry.acquireEntryDocument(entryPath);
    // the resolver acquires the source description on demand — no pre-load.
  });

  const makeExecutor = (
    canned: CannedResponse,
  ): { executor: StepExecutor; clients: StubClient[] } => {
    const clients: StubClient[] = [];
    const executor = new StepExecutor({
      document: entry,
      registry,
      clientFactory: (document) => {
        const client = new StubClient(document, canned);
        clients.push(client);
        return client;
      },
    });
    return { executor, clients };
  };

  const state = () => new WorkflowExecutionState({ inputs: { preferredPetStatus: 'available' } });

  context('operation resolution', function () {
    specify('should resolve a plain operationId and execute it', async function () {
      const step = refractStep({
        stepId: 'findPets',
        operationId: 'findPetsByStatus',
        parameters: [{ name: 'status', in: 'query', value: '$inputs.preferredPetStatus' }],
      }) as StepElement;
      const { executor, clients } = makeExecutor(okResponse);

      const result = await executor.execute(step, state());

      assert.strictEqual(result.stepId, 'findPets');
      assert.strictEqual(result.response.status, 200);
      assert.strictEqual(clients.length, 1);
      // the resolved parameter reached the client.
      assert.deepEqual(clients[0].calls[0].parameters, { status: 'available' });
      // a plain operationId is normalized to the operation's JSON Pointer.
      assert.strictEqual(clients[0].calls[0].operationPath, '/paths/~1pet~1findByStatus/get');
      assert.isUndefined(clients[0].calls[0].operationId);
    });

    specify(
      'should resolve an operationId given as a $sourceDescriptions expression',
      async function () {
        const step = refractStep({
          stepId: 'findPets',
          operationId: '$sourceDescriptions.petstoreAPI.findPetsByStatus',
          parameters: [{ name: 'status', in: 'query', value: 'available' }],
        }) as StepElement;
        const { executor, clients } = makeExecutor(okResponse);

        const result = await executor.execute(step, state());

        assert.strictEqual(result.response.status, 200);
        // the raw expression is normalized to the operation's JSON Pointer, not
        // forwarded to the client verbatim.
        assert.strictEqual(clients[0].calls[0].operationPath, '/paths/~1pet~1findByStatus/get');
        assert.isUndefined(clients[0].calls[0].operationId);
      },
    );

    specify('should resolve an operationPath and execute it', async function () {
      const step = refractStep({
        stepId: 'findPets',
        operationPath: '{$sourceDescriptions.petstoreAPI.url}#/paths/~1pet~1findByStatus/get',
        parameters: [{ name: 'status', in: 'query', value: 'available' }],
      }) as StepElement;
      const { executor, clients } = makeExecutor(okResponse);

      const result = await executor.execute(step, state());

      assert.strictEqual(result.response.status, 200);
      // the client receives the JSON Pointer selector, not an operationId.
      assert.strictEqual(clients[0].calls[0].operationPath, '/paths/~1pet~1findByStatus/get');
      assert.isUndefined(clients[0].calls[0].operationId);
    });

    specify('should throw for an operationId found in no source description', async function () {
      const step = refractStep({ stepId: 's', operationId: 'noSuchOperation' }) as StepElement;
      const { executor } = makeExecutor(okResponse);

      await rejects(executor.execute(step, state()));
    });

    specify('should throw ExecutionError for a step with no operation target', async function () {
      const step = refractStep({ stepId: 's' }) as StepElement;
      const { executor } = makeExecutor(okResponse);

      await rejects(
        executor.execute(step, state()),
        ExecutionError,
        /no operationId or operationPath/,
      );
    });

    specify('should throw ExecutionError for a workflowId step', async function () {
      const step = refractStep({ stepId: 's', workflowId: 'other' }) as StepElement;
      const { executor } = makeExecutor(okResponse);

      await rejects(executor.execute(step, state()), ExecutionError, /workflow executor/);
    });

    specify('should throw ExecutionError when more than one target is declared', async function () {
      const step = refractStep({
        stepId: 's',
        operationId: 'findPetsByStatus',
        workflowId: 'other',
      }) as StepElement;
      const { executor } = makeExecutor(okResponse);

      await rejects(executor.execute(step, state()), ExecutionError, /mutually exclusive/);
    });
  });

  context('outcome', function () {
    specify('should forward the resolved request body and content type', async function () {
      const step = refractStep({
        stepId: 'order',
        operationId: 'placeOrder',
        requestBody: { contentType: 'application/json', payload: { petId: 42, quantity: 1 } },
      }) as StepElement;
      const { executor, clients } = makeExecutor(okResponse);

      await executor.execute(step, state());

      const call = clients[0].calls[0] as OpenAPIOperationExecuteOptions & {
        requestContentType?: string;
      };
      assert.deepEqual(call.requestBody, { petId: 42, quantity: 1 });
      assert.strictEqual(call.requestContentType, 'application/json');
    });

    specify('should be successful when successCriteria pass', async function () {
      const step = refractStep({
        stepId: 'findPets',
        operationId: 'findPetsByStatus',
        parameters: [{ name: 'status', in: 'query', value: 'available' }],
        successCriteria: [{ condition: '$statusCode == 200' }],
        outputs: { pets: '$response.body', status: '$statusCode' },
      }) as StepElement;
      const { executor } = makeExecutor(okResponse);

      const result = await executor.execute(step, state());

      assert.isTrue(result.successful);
      assert.deepEqual(result.outputs.pets, [{ id: 7 }]);
      assert.strictEqual(result.outputs.status, 200);
    });

    specify('should not be successful when a successCriterion fails', async function () {
      const step = refractStep({
        stepId: 'findPets',
        operationId: 'findPetsByStatus',
        parameters: [{ name: 'status', in: 'query', value: 'available' }],
        successCriteria: [{ condition: '$statusCode == 200' }],
      }) as StepElement;
      const { executor } = makeExecutor(notFoundResponse);

      const result = await executor.execute(step, state());

      assert.isFalse(result.successful);
    });

    specify('should select the onFailure action on the failure path', async function () {
      const step = refractStep({
        stepId: 'findPets',
        operationId: 'findPetsByStatus',
        parameters: [{ name: 'status', in: 'query', value: 'available' }],
        successCriteria: [{ condition: '$statusCode == 200' }],
        onFailure: [{ name: 'retry', type: 'retry', retryAfter: 1, retryLimit: 3 }],
      }) as StepElement;
      const { executor } = makeExecutor(notFoundResponse);

      const result = await executor.execute(step, state());

      assert.isFalse(result.successful);
      assert.isDefined(result.action);
    });

    specify(
      'should pass through execute options with Arazzo values taking precedence',
      async function () {
        const step = refractStep({
          stepId: 'findPets',
          operationId: 'findPetsByStatus',
          parameters: [{ name: 'status', in: 'query', value: 'available' }],
        }) as StepElement;
        const { executor, clients } = makeExecutor(okResponse);

        await executor.execute(step, state(), {
          contextUrl: 'https://example.com',
          operationId: 'HIJACK',
          operationPath: '/paths/~1hijacked/get',
        });

        const call = clients[0].calls[0] as OpenAPIOperationExecuteOptions & {
          contextUrl?: string;
        };
        assert.strictEqual(call.contextUrl, 'https://example.com');
        // the Arazzo-derived operationPath wins: the operationPath passthrough is
        // overridden and the operationId passthrough is cleared, so executeOptions
        // cannot hijack the target.
        assert.strictEqual(call.operationPath, '/paths/~1pet~1findByStatus/get');
        assert.isUndefined(call.operationId);
      },
    );
  });
});
