import type {
  RuntimeExpressionContext,
  RuntimeExpressionRequestContext,
  RuntimeExpressionResponseContext,
} from '../expression/RuntimeExpressionContext.ts';

/**
 * Options for the WorkflowExecutionState.
 * @public
 */
export interface WorkflowExecutionStateOptions {
  /**
   * The workflow inputs, fixed for the run and read via `$inputs`.
   */
  readonly inputs?: Record<string, unknown>;
}

/**
 * Accumulates the runtime state of a workflow run and produces the context a
 * runtime expression is evaluated against.
 *
 * It holds only workflow-scoped state that grows as the run proceeds and is read
 * back through `$`-expressions: `$inputs`, `$steps.{id}.outputs`,
 * `$workflows.{id}.{inputs,outputs}`, and the workflow's own `$outputs`. Static,
 * document-sourced expressions (`$components`, `$sourceDescriptions`) are
 * resolved on demand by the evaluator and are not stored here; control-flow
 * position, retries, and traces belong to the executor, not to this state.
 *
 * Resolving a step's `outputs` declaration to values is the executor's job; the
 * resolved values are handed here as plain objects, keeping this state free of
 * ApiDOM and evaluation concerns. The step-scoped request/response of the
 * current step are layered on at read time via {@link WorkflowExecutionState.toContext}.
 * @public
 */
class WorkflowExecutionState {
  readonly #inputs: Record<string, unknown>;
  readonly #outputs: Record<string, unknown> = {};
  readonly #steps: Map<string, Record<string, unknown>> = new Map();
  readonly #workflows: Map<
    string,
    { inputs?: Record<string, unknown>; outputs?: Record<string, unknown> }
  > = new Map();

  constructor(options: WorkflowExecutionStateOptions = {}) {
    this.#inputs = options.inputs ?? {};
  }

  /**
   * Records the resolved outputs of a completed step, read via
   * `$steps.{stepId}.outputs.{name}`.
   */
  setStepOutputs(stepId: string, outputs: Record<string, unknown>): void {
    this.#steps.set(stepId, outputs);
  }

  /**
   * Sets a single workflow output, read via `$outputs.{name}`.
   */
  setOutput(name: string, value: unknown): void {
    this.#outputs[name] = value;
  }

  /**
   * Records the resolved inputs and outputs of a workflow (typically a called
   * sub-workflow), read via `$workflows.{workflowId}.{inputs,outputs}.{name}`.
   */
  setWorkflow(
    workflowId: string,
    workflow: { inputs?: Record<string, unknown>; outputs?: Record<string, unknown> },
  ): void {
    this.#workflows.set(workflowId, workflow);
  }

  /**
   * The workflow's own accumulated outputs. Read-only by contract, like the
   * context produced by `toContext`; treat the returned object as immutable.
   */
  get outputs(): Readonly<Record<string, unknown>> {
    return this.#outputs;
  }

  /**
   * Produces the runtime expression context for the current evaluation site.
   *
   * The accumulated workflow-scoped state is combined with the optional
   * step-scoped `request`/`response` of the step being evaluated. Omit both when
   * evaluating before a request is made (e.g. resolving parameters), so that
   * `$request`/`$response`/`$statusCode` correctly resolve to `undefined`.
   */
  toContext(
    request?: RuntimeExpressionRequestContext,
    response?: RuntimeExpressionResponseContext,
  ): RuntimeExpressionContext {
    return {
      request,
      response,
      inputs: this.#inputs,
      outputs: this.#outputs,
      steps: Object.fromEntries([...this.#steps].map(([stepId, outputs]) => [stepId, { outputs }])),
      workflows: Object.fromEntries(this.#workflows),
    };
  }
}

export default WorkflowExecutionState;
