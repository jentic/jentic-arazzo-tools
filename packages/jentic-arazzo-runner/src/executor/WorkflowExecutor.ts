import { toValue } from '@speclynx/apidom-core';
import { isArrayElement, isStringElement } from '@speclynx/apidom-datamodel';
import {
  isStepElement,
  type WorkflowElement,
  type StepElement,
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
import StepExecutor, { type StepDefaultActions } from './StepExecutor.ts';
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
   * Upper bound on the number of step executions in a single run, guarding
   * against a runaway `goto` loop. Defaults to 1000.
   */
  readonly maxSteps?: number;
}

/**
 * The trace of a single step execution within a workflow run.
 * @public
 */
export interface StepRunRecord {
  readonly stepId: string;
  readonly successful: boolean;
  readonly action: SelectedAction | undefined;
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
 * targets the next step); `goto-step` jumps to a step by id within the current
 * workflow; `end` stops the run with `status: ended`; `break` stops with
 * `status: failed` (the failure default).
 */
type Transition =
  | { readonly kind: 'next' }
  | { readonly kind: 'goto-step'; readonly stepId: string }
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
 * This initial version is the backbone: linear flow, `goto` to a step, `end`,
 * the break-default, and workflow-level default `successActions` /
 * `failureActions` a step inherits when it declares none of its own (a step's
 * own list overrides the workflow default wholesale — no merge). Retry,
 * sub-workflow (`workflowId`) steps, step-level `goto` to a workflow, and
 * `dependsOn` are not yet supported and throw {@link ExecutionError} rather than
 * behaving incorrectly.
 * @public
 */
class WorkflowExecutor {
  static readonly #DEFAULT_MAX_STEPS = 1000;

  readonly #document: ArazzoDocument;
  readonly #registry: DocumentRegistry;
  readonly #maxSteps: number;
  readonly #extractor = new ArazzoWorkflowExtractor();
  readonly #normalizer = new ArazzoWorkflowNormalizer();
  readonly #outputResolver = new OutputResolver();
  readonly #stepExecutor: StepExecutor;

  constructor(options: WorkflowExecutorOptions) {
    this.#document = options.document;
    this.#registry = options.registry;
    this.#maxSteps = options.maxSteps ?? WorkflowExecutor.#DEFAULT_MAX_STEPS;
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
    let stepCount = 0;
    let status: WorkflowExecutionResult['status'] = 'completed';

    while (index < steps.length) {
      if (++stepCount > this.#maxSteps) {
        throw new ExecutionError(
          `workflow "${workflowId}" exceeded the step budget of ${this.#maxSteps} (a goto loop, or a workflow longer than maxSteps)`,
          { workflowId, reason: 'step-budget' },
        );
      }

      const step = steps[index];
      const stepId = toValue(step.stepId) as string;

      this.#rejectUnsupportedStep(step, stepId, workflowId);

      const outcome = await this.#stepExecutor.execute(step, state, executeOptions, defaultActions);
      state.setStepOutputs(outcome.stepId, outcome.outputs);
      trace.push({
        stepId: outcome.stepId,
        successful: outcome.successful,
        action: outcome.action,
      });

      const transition = this.#interpret(outcome.action, outcome.successful, workflowId, stepId);
      if (transition.kind === 'next') {
        index += 1;
      } else if (transition.kind === 'goto-step') {
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
   * Interprets the action a step selected into the loop's next transition.
   *
   * With no matching action, applies the path default: the next sequential step
   * on success, break-and-return on failure. A `goto` targeting a `stepId`
   * jumps within the current workflow. Action types not yet supported (`retry`,
   * `goto` targeting a `workflowId`) throw rather than behave incorrectly.
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
        return { kind: 'goto-step', stepId: toValue(action.stepId) as string };
      }
      throw new ExecutionError(
        `goto action on step "${stepId}" in workflow "${workflowId}" has neither stepId nor workflowId`,
        { stepId, workflowId, reason: 'goto-target-missing' },
      );
    }
    if (type === 'retry') {
      throw new ExecutionError(
        `retry action on step "${stepId}" in workflow "${workflowId}" is not supported yet`,
        { stepId, workflowId, reason: 'retry-unsupported' },
      );
    }

    // an unknown action type is malformed input, not a defined control flow.
    throw new ExecutionError(
      `action on step "${stepId}" in workflow "${workflowId}" has unsupported type "${type}"`,
      { stepId, workflowId, reason: 'unknown-action-type' },
    );
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
