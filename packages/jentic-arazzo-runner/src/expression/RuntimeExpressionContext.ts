/**
 * Request-side data available to runtime expressions.
 *
 * Populated by the step executor from the HTTP request that was (or will be) sent.
 * Header lookup is case-insensitive because the runtime expression parser
 * lowercases header tokens.
 * @public
 */
export interface RuntimeExpressionRequestContext {
  readonly url?: string;
  readonly method?: string;
  readonly header?: Record<string, unknown>;
  readonly query?: Record<string, unknown>;
  readonly path?: Record<string, unknown>;
  readonly body?: unknown;
}

/**
 * Response-side data available to runtime expressions.
 *
 * Populated by the step executor from the HTTP response that was received.
 * Header lookup is case-insensitive because the runtime expression parser
 * lowercases header tokens.
 * @public
 */
export interface RuntimeExpressionResponseContext {
  readonly statusCode?: number;
  readonly header?: Record<string, unknown>;
  readonly body?: unknown;
}

/**
 * Per-step state available to `$steps.{stepId}.outputs.{name}` expressions.
 * @public
 */
export interface RuntimeExpressionStepContext {
  readonly outputs?: Record<string, unknown>;
}

/**
 * Per-workflow state available to `$workflows.{workflowId}.{inputs|outputs}.{name}` expressions.
 * @public
 */
export interface RuntimeExpressionWorkflowContext {
  readonly inputs?: Record<string, unknown>;
  readonly outputs?: Record<string, unknown>;
}

/**
 * The runtime state an Arazzo runtime expression is evaluated against.
 *
 * Each field maps to an AST node produced by the runtime expression parser:
 * - `request.url` / `request.method` back `$url` / `$method`
 * - `request.header` / `.query` / `.path` / `.body` back `$request.{source}`
 * - `response.statusCode` backs `$statusCode`
 * - `response.header` / `.body` back `$response.{source}`
 * - `inputs` backs `$inputs.{name}`
 * - `outputs` backs `$outputs.{name}`
 * - `steps` backs `$steps.{stepId}.outputs.{name}`
 * - `workflows` backs `$workflows.{workflowId}.{inputs|outputs}.{name}`
 *
 * The context holds only genuinely runtime state. Static, document-sourced
 * expressions — `$components.{field}.{name}` and
 * `$sourceDescriptions.{name}.{reference}` — are resolved on demand by the
 * evaluator against the document registry, not carried here.
 *
 * Payload-bearing values (`request.body`, `response.body`, step/workflow output
 * values) are drilled through a composed JSON Pointer realm, so they may be
 * either plain JS values or ApiDOM elements.
 * @public
 */
export interface RuntimeExpressionContext {
  readonly request?: RuntimeExpressionRequestContext;
  readonly response?: RuntimeExpressionResponseContext;
  readonly inputs?: unknown;
  readonly outputs?: unknown;
  readonly steps?: Record<string, RuntimeExpressionStepContext>;
  readonly workflows?: Record<string, RuntimeExpressionWorkflowContext>;
}
