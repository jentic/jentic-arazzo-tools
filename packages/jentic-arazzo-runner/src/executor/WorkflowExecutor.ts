import { toValue } from '@speclynx/apidom-core';
import { isArrayElement, isNumberElement, isStringElement } from '@speclynx/apidom-datamodel';
import {
  isStepElement,
  isFailureActionElement,
  type WorkflowElement,
  type StepElement,
  type FailureActionElement,
} from '@speclynx/apidom-ns-arazzo-1';

import type ArazzoDocument from '../document/ArazzoDocument.ts';
import type DocumentRegistry from '../registry/DocumentRegistry.ts';
import type { WorkflowId } from '../document/ArazzoWorkflowIndex.ts';
import type { RuntimeExpressionContext } from '../expression/RuntimeExpressionContext.ts';
import RuntimeExpressionEvaluator from '../expression/RuntimeExpressionEvaluator.ts';
import ArazzoWorkflowExtractor from '../extractor/ArazzoWorkflowExtractor.ts';
import ArazzoWorkflowNormalizer from '../normalizer/ArazzoWorkflowNormalizer.ts';
import OutputResolver from '../resolver/OutputResolver.ts';
import WorkflowExecutionState from '../state/WorkflowExecutionState.ts';
import StepExecutor, { type StepDefaultActions, type StepExecutionResult } from './StepExecutor.ts';
import type { SelectedAction } from '../action/ActionResolver.ts';
import ExecutionError from '../errors/ExecutionError.ts';

/**
 * Options for the WorkflowExecutor.
 * @public
 */
export interface WorkflowExecutorOptions {
  /**
   * The entry Arazzo document holding the workflows to run; also the source of
   * `$components` / `$sourceDescriptions` the executor resolves workflow
   * `outputs` against.
   */
  readonly document: ArazzoDocument;
  /**
   * The document registry holding the already-loaded source documents.
   */
  readonly registry: DocumentRegistry;
  /**
   * The per-step engine every step is delegated to. Build it with the client
   * factory (or a deterministic stub in tests) and pass it in — the workflow
   * executor is agnostic to how a step reaches the live API.
   */
  readonly stepExecutor: StepExecutor;
  /**
   * Upper bound on the number of operation executions in a single run — every
   * step attempt, including each `retry`, counts. Guards against both a runaway
   * `goto` loop and a runaway `retry`. Defaults to 1000.
   */
  readonly maxSteps?: number;
  /**
   * Delays for the given number of milliseconds — awaited between a step's retry
   * attempts (`retryAfter`). Injected so tests pass a no-op and real runs delay;
   * defaults to a real timer.
   */
  readonly sleep?: (ms: number) => Promise<void>;
}

/**
 * The trace of a single step execution within a workflow run.
 * @public
 */
export interface StepRunRecord {
  readonly stepId: string;
  readonly successful: boolean;
  readonly action: SelectedAction | undefined;
  /**
   * How many times the step's operation ran — 1 with no retries, more when a
   * `retry` action fired. The final `successful` / `action` reflect the last
   * attempt.
   */
  readonly attempts: number;
}

/**
 * The outcome of executing a workflow.
 *
 * `status` is `completed` when the steps ran to the end of the list, `ended`
 * when an `end` action stopped the run early, and `failed` when a step failed
 * and no matching `onFailure` action redirected it (the break-and-return
 * default).
 * @public
 */
export interface WorkflowExecutionResult {
  readonly workflowId: string;
  readonly outputs: Record<string, unknown>;
  readonly steps: readonly StepRunRecord[];
  readonly status: 'completed' | 'ended' | 'failed';
}

/**
 * The control-flow transition selected for a step outcome — how the loop
 * advances after interpreting the step's {@link SelectedAction}.
 *
 * `next` runs the following step (the success default, or a matched `goto` that
 * targets the next step); `goto` jumps to a step by id within the current
 * workflow; `end` stops the run with `status: ended`; `break` stops with
 * `status: failed` (the failure default).
 */
type Transition =
  | { readonly kind: 'next' }
  | { readonly kind: 'goto'; readonly stepId: string }
  | { readonly kind: 'end' }
  | { readonly kind: 'break' };

/**
 * Executes an Arazzo workflow: the stateful loop that turns "run one step" into
 * "run a workflow".
 *
 * It iterates a workflow's steps in list order, delegating each to
 * {@link StepExecutor}, records the resolved step outputs into a
 * {@link WorkflowExecutionState} so later steps read `$steps.{id}.outputs.{name}`,
 * and interprets the {@link SelectedAction} the step executor selects but does
 * not act on — advancing to the next step, jumping via `goto`, or stopping on
 * `end` / the failure break-default. After the loop it resolves the workflow's
 * `outputs` against the final state.
 *
 * State is created fresh per {@link WorkflowExecutor.execute} call and owned
 * here; the returned result is read-only. Authoring errors (missing workflow,
 * unknown `goto` target, step-budget overflow) throw {@link ExecutionError}; a
 * step that legitimately fails and breaks is a normal `status: 'failed'`
 * result, not a throw — the same split {@link StepExecutor} draws.
 *
 * This version supports: linear flow, `goto` to a step, `end`, the
 * break-default, `retry` actions (with `retryLimit` / `retryAfter` and the
 * exhaustion fall-through to subsequent failure actions), and workflow-level
 * default `successActions` / `failureActions` a step inherits when it declares
 * none of its own (a step's own list overrides the workflow default wholesale —
 * no merge). Sub-workflow (`workflowId`) steps, step-level `goto` to a workflow,
 * a `retry` carrying a `stepId` / `workflowId` reference, and `dependsOn` are
 * not yet supported and throw {@link ExecutionError} rather than behaving
 * incorrectly.
 * @public
 */
class WorkflowExecutor {
  static readonly #DEFAULT_MAX_STEPS = 1000;
  static readonly #DEFAULT_RETRY_LIMIT = 1;
  static readonly #DEFAULT_SLEEP = (ms: number): Promise<void> =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  readonly #document: ArazzoDocument;
  readonly #registry: DocumentRegistry;
  readonly #maxSteps: number;
  readonly #sleep: (ms: number) => Promise<void>;
  readonly #extractor = new ArazzoWorkflowExtractor();
  readonly #normalizer = new ArazzoWorkflowNormalizer();
  readonly #outputResolver = new OutputResolver();
  readonly #stepExecutor: StepExecutor;

  constructor(options: WorkflowExecutorOptions) {
    this.#document = options.document;
    this.#registry = options.registry;
    this.#maxSteps = options.maxSteps ?? WorkflowExecutor.#DEFAULT_MAX_STEPS;
    this.#sleep = options.sleep ?? WorkflowExecutor.#DEFAULT_SLEEP;
    this.#stepExecutor = options.stepExecutor;
  }

  /**
   * Runs the named workflow to completion, returning its outcome.
   *
   * `inputs` seed the run's `$inputs`; `executeOptions` is the opaque
   * client-specific bag forwarded verbatim to every {@link StepExecutor.execute}.
   *
   * All run-scoped state (the execution state, the step trace, the control-flow
   * position) is local to this call, so concurrent `execute` calls on one
   * executor do not interfere. When sub-workflow calls and `dependsOn` land,
   * their cycle-detection and completed-workflow tracking will likewise be
   * threaded per run — not held on the instance — for the same reason.
   */
  async execute(
    workflowId: WorkflowId,
    inputs: Record<string, unknown> = {},
    executeOptions: Record<string, unknown> = {},
  ): Promise<WorkflowExecutionResult> {
    const workflow = await this.#resolveWorkflow(workflowId);
    const steps = this.#orderedSteps(workflow, workflowId);
    // the workflow-level default actions every step falls back to when it
    // declares no onSuccess / onFailure of its own (resolved once per run).
    const defaultActions: StepDefaultActions = {
      onSuccess: workflow.successActions,
      onFailure: workflow.failureActions,
    };
    const state = new WorkflowExecutionState({ inputs });
    const trace: StepRunRecord[] = [];

    let index = 0;
    // total operation executions this run, charged once per attempt (including
    // retries) so both a runaway `goto` loop and a runaway `retry` are bounded by
    // the one budget. Threaded into #runStepWithRetry so retries count too.
    const budget = { spent: 0 };
    let status: WorkflowExecutionResult['status'] = 'completed';

    while (index < steps.length) {
      const step = steps[index];
      const stepId = toValue(step.stepId) as string;

      this.#rejectUnsupportedStep(step, stepId, workflowId);

      // run the step, honoring any retry actions internally; `action` is the
      // terminal action after retries are exhausted (retry itself never leaves
      // this call), and `attempts` is how many times the operation ran.
      const { outcome, action, attempts } = await this.#runStepWithRetry(
        step,
        state,
        executeOptions,
        defaultActions,
        workflowId,
        stepId,
        budget,
      );
      state.setStepOutputs(outcome.stepId, outcome.outputs);
      trace.push({
        stepId: outcome.stepId,
        successful: outcome.successful,
        action,
        attempts,
      });

      const transition = this.#interpret(action, outcome.successful, workflowId, stepId);
      if (transition.kind === 'next') {
        index += 1;
      } else if (transition.kind === 'goto') {
        index = this.#indexOfStep(steps, transition.stepId, workflowId);
      } else if (transition.kind === 'end') {
        status = 'ended';
        break;
      } else {
        status = 'failed';
        break;
      }
    }

    const outputs = this.#resolveWorkflowOutputs(workflow, state);
    return { workflowId, outputs, steps: trace, status };
  }

  /**
   * Extracts and normalizes the workflow by id. A workflow the entry document
   * does not define is the executor-level `workflow-not-found` authoring error,
   * raised here rather than leaking the extractor's `ExtractionError`.
   */
  async #resolveWorkflow(workflowId: WorkflowId): Promise<WorkflowElement> {
    if (!this.#document.workflowIndex.has(workflowId)) {
      throw new ExecutionError(
        `workflow "${workflowId}" not found in Arazzo document at "${this.#document.uri}"`,
        { workflowId, reason: 'workflow-not-found' },
      );
    }
    const workflow = this.#extractor.extract(this.#document, workflowId);
    return this.#normalizer.normalize(workflow, this.#document);
  }

  /**
   * The workflow's steps as an array in list order. An absent `steps` is a
   * workflow with no steps — an empty list, a completed no-op run. A present but
   * malformed `steps` (not a list, or holding a non-step entry) is an authoring
   * error and throws rather than being silently treated as empty or partial.
   */
  #orderedSteps(workflow: WorkflowElement, workflowId: string): StepElement[] {
    if (!workflow.hasKey('steps')) return [];

    const steps = workflow.steps;
    if (!isArrayElement(steps)) {
      throw new ExecutionError(`workflow "${workflowId}" has a non-list "steps"`, {
        workflowId,
        reason: 'malformed-steps',
      });
    }

    return [...steps].map((step, index) => {
      if (!isStepElement(step)) {
        throw new ExecutionError(
          `workflow "${workflowId}" has a non-step entry at steps[${index}]`,
          { workflowId, reason: 'malformed-steps' },
        );
      }
      return step;
    });
  }

  /**
   * Rejects the steps this initial version does not yet run: a sub-workflow
   * (`workflowId`) step. {@link StepExecutor} itself throws `workflow-step` on
   * these, so this is a clearer, workflow-scoped diagnostic ahead of that.
   */
  #rejectUnsupportedStep(step: StepElement, stepId: string, workflowId: string): void {
    if (isStringElement(step.workflowId)) {
      throw new ExecutionError(
        `step "${stepId}" in workflow "${workflowId}" targets a sub-workflow; not supported yet`,
        { stepId, workflowId, reason: 'workflow-step-unsupported' },
      );
    }
  }

  /**
   * Interprets the terminal action a step resolved to into the loop's next
   * transition.
   *
   * With no matching action, applies the path default: the next sequential step
   * on success, break-and-return on failure. A `goto` targeting a `stepId` jumps
   * within the current workflow. `retry` never reaches here — it is consumed by
   * {@link WorkflowExecutor.#runStepWithRetry}, which returns only the terminal
   * action a retry chain resolves to. `goto` targeting a `workflowId` is not yet
   * supported and throws.
   */
  #interpret(
    action: SelectedAction | undefined,
    successful: boolean,
    workflowId: string,
    stepId: string,
  ): Transition {
    if (action === undefined) {
      // path default: next step on success, break-and-return on failure.
      return successful ? { kind: 'next' } : { kind: 'break' };
    }

    const type = toValue(action.type) as string;
    if (type === 'end') {
      return { kind: 'end' };
    }
    if (type === 'goto') {
      if (isStringElement(action.workflowId)) {
        throw new ExecutionError(
          `action on step "${stepId}" in workflow "${workflowId}" gotos a workflowId; not supported yet`,
          { stepId, workflowId, reason: 'goto-workflow-unsupported' },
        );
      }
      if (isStringElement(action.stepId)) {
        return { kind: 'goto', stepId: toValue(action.stepId) as string };
      }
      throw new ExecutionError(
        `goto action on step "${stepId}" in workflow "${workflowId}" has neither stepId nor workflowId`,
        { stepId, workflowId, reason: 'goto-target-missing' },
      );
    }

    // an unknown action type is malformed input, not a defined control flow.
    // (`retry` is resolved away in #runStepWithRetry and never arrives here.)
    throw new ExecutionError(
      `action on step "${stepId}" in workflow "${workflowId}" has unsupported type "${type}"`,
      { stepId, workflowId, reason: 'unknown-action-type' },
    );
  }

  /**
   * Runs a step, applying its `retry` failure actions before returning a
   * terminal outcome.
   *
   * On success (or an immediate non-retry failure) the step runs once. On a
   * failure whose first matching action is a `retry`, the operation is re-run up
   * to that action's `retryLimit` (default 1) with a `retryAfter`-second delay
   * between attempts. Per spec — "retryLimit MUST be exhausted prior to executing
   * subsequent failure actions" — an exhausted retry falls through to the *next*
   * matching failure action of the latest attempt, which may itself be another
   * `retry` with its own independent budget, or a terminal `end` / `goto`. Each
   * attempt re-runs the operation and re-selects against the fresh response.
   *
   * Returns the last attempt's `outcome`, the resolved terminal `action` (never a
   * `retry`; `undefined` when nothing terminal matched, so the loop applies the
   * path default), and the number of `attempts` made.
   */
  async #runStepWithRetry(
    step: StepElement,
    state: WorkflowExecutionState,
    executeOptions: Record<string, unknown>,
    defaultActions: StepDefaultActions,
    workflowId: string,
    stepId: string,
    budget: { spent: number },
  ): Promise<{
    outcome: StepExecutionResult;
    action: SelectedAction | undefined;
    attempts: number;
  }> {
    // attempts already spent on each retry action, keyed by the action element.
    // The element is the correct identity here: re-running the step returns the
    // same element instances (the workflow is normalized once and `onFailure`'s
    // getter returns its stored children — nothing re-refracts per call), and
    // keying by the element survives the criteria re-filtering that varies
    // `matchedActions` between attempts (position within that filtered list is
    // NOT stable when a response change drops an earlier action). So each retry
    // in a chain keeps its own independent budget across re-runs.
    const retriesSpent = new Map<SelectedAction, number>();
    let attempts = 0;

    for (;;) {
      // charge the shared run budget per operation execution — this is what
      // bounds a runaway retry (and, since every step entry runs ≥1 attempt, a
      // runaway goto loop) rather than an unbounded spin.
      if (++budget.spent > this.#maxSteps) {
        throw new ExecutionError(
          `workflow "${workflowId}" exceeded its budget of ${this.#maxSteps} operation executions (a goto loop or excessive retries)`,
          { workflowId, stepId, reason: 'step-budget' },
        );
      }

      const outcome = await this.#stepExecutor.execute(step, state, executeOptions, defaultActions);
      attempts += 1;

      if (outcome.successful) {
        return { outcome, action: outcome.action, attempts };
      }

      // walk the matching failure actions: fire the first retry that still has
      // budget, else fall through to the first terminal (non-retry) action.
      let fired = false;
      let terminal: SelectedAction | undefined;
      for (const action of outcome.matchedActions) {
        if (!this.#isRetry(action)) {
          terminal = action;
          break;
        }
        const spent = retriesSpent.get(action) ?? 0;
        if (spent >= this.#retryLimit(action)) continue; // exhausted — try the next action

        this.#rejectRetryReference(action, stepId, workflowId);
        retriesSpent.set(action, spent + 1);
        // only sleep for a real, positive delay — skip the event-loop yield of
        // sleep(0) for immediate retries, and never hand a custom sleep a
        // zero/negative/NaN value.
        const delayMs = this.#retryAfterMs(action);
        if (delayMs > 0) await this.#sleep(delayMs);
        fired = true;
        break;
      }

      if (fired) continue; // re-run the step
      return { outcome, action: terminal, attempts };
    }
  }

  /**
   * Whether a matched action is a `retry` failure action (narrowing it to
   * {@link FailureActionElement} so `retryLimit` / `retryAfter` are accessible).
   */
  #isRetry(action: SelectedAction): action is FailureActionElement {
    return isFailureActionElement(action) && (toValue(action.type) as string) === 'retry';
  }

  /**
   * A `retry` action's attempt budget — its `retryLimit`, or the default of 1
   * when unset or non-numeric.
   */
  #retryLimit(action: FailureActionElement): number {
    return isNumberElement(action.retryLimit)
      ? (toValue(action.retryLimit) as number)
      : WorkflowExecutor.#DEFAULT_RETRY_LIMIT;
  }

  /**
   * The delay before a retry, in milliseconds — the action's `retryAfter`
   * (seconds) converted. `0` when unset, non-numeric, or not a finite positive
   * value (a negative or `NaN` `retryAfter` means "no wait", never a bad value
   * handed to `sleep`).
   */
  #retryAfterMs(action: FailureActionElement): number {
    if (!isNumberElement(action.retryAfter)) return 0;
    const ms = (toValue(action.retryAfter) as number) * 1000;
    return Number.isFinite(ms) && ms > 0 ? ms : 0;
  }

  /**
   * Rejects a `retry` action that carries a `stepId` / `workflowId` reference to
   * execute before retrying — a defined feature ("the reference is executed and
   * the context is returned, after which the current step is retried") that is
   * not yet supported, so it throws rather than silently ignoring the reference.
   */
  #rejectRetryReference(action: FailureActionElement, stepId: string, workflowId: string): void {
    if (isStringElement(action.stepId) || isStringElement(action.workflowId)) {
      throw new ExecutionError(
        `retry action on step "${stepId}" in workflow "${workflowId}" carries a stepId/workflowId reference; not supported yet`,
        { stepId, workflowId, reason: 'retry-reference-unsupported' },
      );
    }
  }

  /**
   * The index of the `goto` target step within the current workflow; a target
   * that names no step in this workflow is an authoring error.
   */
  #indexOfStep(steps: readonly StepElement[], stepId: string, workflowId: string): number {
    const index = steps.findIndex((step) => (toValue(step.stepId) as string) === stepId);
    if (index === -1) {
      throw new ExecutionError(
        `goto target step "${stepId}" not found in workflow "${workflowId}"`,
        { stepId, workflowId, reason: 'goto-target-not-found' },
      );
    }
    return index;
  }

  /**
   * Resolves the workflow's `outputs` declaration against the final run state,
   * mirroring how {@link StepExecutor} resolves a step's outputs.
   */
  #resolveWorkflowOutputs(
    workflow: WorkflowElement,
    state: WorkflowExecutionState,
  ): Record<string, unknown> {
    const context = state.toContext();
    return this.#outputResolver.resolve(workflow.outputs, (expression) =>
      this.#evaluate(context, expression),
    );
  }

  /**
   * Resolves a runtime expression leniently against a context, forwarding
   * `$components` / `$sourceDescriptions` resolution to the document and
   * registry — the workflow-scoped counterpart of {@link StepExecutor}'s bridge.
   */
  #evaluate(context: RuntimeExpressionContext, expression: string): unknown {
    return new RuntimeExpressionEvaluator(context, {
      strict: false,
      document: this.#document,
      registry: this.#registry,
    }).evaluate(expression);
  }
}

export default WorkflowExecutor;
