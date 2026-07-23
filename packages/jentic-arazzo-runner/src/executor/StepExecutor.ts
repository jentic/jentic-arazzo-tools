import { toValue } from '@speclynx/apidom-core';
import { isArrayElement, isStringElement } from '@speclynx/apidom-datamodel';
import {
  isCriterionElement,
  type StepElement,
  type WorkflowSuccessActionsElement,
  type WorkflowFailureActionsElement,
} from '@speclynx/apidom-ns-arazzo-1';

import type ArazzoDocument from '../document/ArazzoDocument.ts';
import type DocumentRegistry from '../registry/DocumentRegistry.ts';
import type { OpenAPIOperationExecuteOptions } from '../client/OpenAPIClient.ts';
import type OpenAPIOperationResponse from '../client/OpenAPIOperationResponse.ts';
import type {
  RuntimeExpressionContext,
  RuntimeExpressionRequestContext,
  RuntimeExpressionResponseContext,
} from '../expression/RuntimeExpressionContext.ts';
import RuntimeExpressionEvaluator from '../expression/RuntimeExpressionEvaluator.ts';
import CriterionEvaluator from '../criterion/CriterionEvaluator.ts';
import ParameterResolver from '../resolver/ParameterResolver.ts';
import RequestBodyResolver, { type ResolvedRequestBody } from '../resolver/RequestBodyResolver.ts';
import OutputResolver from '../resolver/OutputResolver.ts';
import ActionResolver, { type SelectedAction } from '../action/ActionResolver.ts';
import OpenAPIOperationExecutor from './OpenAPIOperationExecutor.ts';
import OpenAPIOperationLocatorNormalizer, {
  type OpenAPIOperationLocator,
} from './OpenAPIOperationLocatorNormalizer.ts';
import ExecutionError from '../errors/ExecutionError.ts';

/**
 * A read-only source of the runtime expression context for a step.
 *
 * The step executor only reads accumulated run state — it produces the
 * pre-request context (`toContext()`) and the post-request context
 * (`toContext(request, response)`) — and never mutates it, so it depends on
 * this narrow interface rather than the full execution state.
 * @public
 */
export interface ContextSource {
  toContext(
    request?: RuntimeExpressionContext['request'],
    response?: RuntimeExpressionResponseContext,
  ): RuntimeExpressionContext;
}

/**
 * Options for the StepExecutor.
 * @public
 */
export interface StepExecutorOptions {
  /**
   * The entry Arazzo document the step belongs to; used to resolve the step's
   * operation locator against its source descriptions, and to resolve
   * `$components` / `$sourceDescriptions` in expressions.
   */
  readonly document: ArazzoDocument;
  /**
   * The document registry holding the already-loaded source documents.
   */
  readonly registry: DocumentRegistry;
  /**
   * The operation engine each step's located operation is delegated to. Build it
   * with the client factory (or a deterministic stub in tests) and pass it in —
   * the step executor is agnostic to how the operation reaches the live API.
   */
  readonly operationExecutor: OpenAPIOperationExecutor;
}

/**
 * The workflow-level default actions a step falls back to when it declares none
 * of its own.
 *
 * Per Arazzo 1.0.1 a workflow's `successActions` / `failureActions` are
 * "applicable for all steps"; a step that declares its own `onSuccess` /
 * `onFailure` list **overrides** the corresponding workflow list wholesale —
 * there is no per-action merge. The two lists are independent: a step may
 * override only its failure actions and still inherit the workflow's success
 * actions.
 * @public
 */
export interface StepDefaultActions {
  readonly onSuccess?: WorkflowSuccessActionsElement;
  readonly onFailure?: WorkflowFailureActionsElement;
}

/**
 * The outcome of executing a single step.
 * @public
 */
export interface StepExecutionResult {
  readonly stepId: string;
  readonly response: OpenAPIOperationResponse;
  readonly successful: boolean;
  readonly outputs: Record<string, unknown>;
  readonly action: SelectedAction | undefined;
}

/**
 * Executes a single Arazzo step that invokes an OpenAPI operation.
 *
 * The pipeline locates the step's operation (`operationId` / `operationPath`),
 * resolves the step's parameters and request body against the pre-request
 * context, delegates to {@link OpenAPIOperationExecutor} to run the located
 * operation, then evaluates `successCriteria`, resolves `outputs`, and selects
 * the `onSuccess`/`onFailure` action against the post-request context.
 *
 * It reads run state through a {@link ContextSource} and mutates nothing — the
 * caller records the returned outputs and interprets the returned action. A step
 * targeting a `workflowId` (a sub-workflow) is not an operation step and throws
 * {@link ExecutionError}; running sub-workflows is the workflow executor's
 * concern. A received response with unmet criteria is a normal
 * `successful: false` outcome; only malformed input (e.g. an invalid criterion
 * or expression) throws.
 * @public
 */
class StepExecutor {
  /**
   * The mutually exclusive fields by which a step names its target. A step may
   * declare at most one. Extend this as the Arazzo Specification adds targets
   * (e.g. `channelPath` in 1.1.0) so the exclusivity check stays complete.
   */
  static readonly #TARGET_FIELDS = ['operationId', 'operationPath', 'workflowId'] as const;

  readonly #document: ArazzoDocument;
  readonly #registry: DocumentRegistry;
  readonly #locatorNormalizer: OpenAPIOperationLocatorNormalizer;
  readonly #operationExecutor: OpenAPIOperationExecutor;
  readonly #parameterResolver = new ParameterResolver();
  readonly #requestBodyResolver = new RequestBodyResolver();
  readonly #outputResolver = new OutputResolver();
  readonly #criterionEvaluator = new CriterionEvaluator();
  readonly #actionResolver = new ActionResolver();

  constructor(options: StepExecutorOptions) {
    this.#document = options.document;
    this.#registry = options.registry;
    this.#locatorNormalizer = new OpenAPIOperationLocatorNormalizer(options.registry);
    this.#operationExecutor = options.operationExecutor;
  }

  /**
   * Executes the step against the given run state, returning its outcome.
   *
   * `executeOptions` is an opaque bag of client-specific execute options passed
   * through to the client (e.g. a swagger client's `contextUrl` base URL for a
   * relative server, or an `AbortSignal`). The Arazzo-derived options
   * (`operationId`, `parameters`, `requestBody`) always take precedence over it.
   *
   * `defaultActions` are the workflow-level `successActions` / `failureActions`
   * the step falls back to when it declares no `onSuccess` / `onFailure` of its
   * own; the workflow executor supplies them. A step's own list overrides the
   * matching default wholesale — see {@link StepDefaultActions}.
   */
  async execute(
    step: StepElement,
    state: ContextSource,
    executeOptions: Record<string, unknown> = {},
    defaultActions: StepDefaultActions = {},
  ): Promise<StepExecutionResult> {
    const stepId = toValue(step.stepId) as string;

    // a step's target fields are mutually exclusive; declaring more than one is
    // malformed and has no defined resolution.
    const declaredTargets = StepExecutor.#TARGET_FIELDS.filter((field) =>
      isStringElement(step[field]),
    );
    if (declaredTargets.length > 1) {
      throw new ExecutionError(
        `Step "${stepId}" declares more than one of ${StepExecutor.#TARGET_FIELDS.join(', ')} (mutually exclusive)`,
        { stepId, reason: 'ambiguous-target' },
      );
    }

    if (isStringElement(step.workflowId)) {
      throw new ExecutionError(`Step "${stepId}" targets a workflowId; use the workflow executor`, {
        stepId,
        reason: 'workflow-step',
      });
    }

    // locate which operation the step invokes — reduced to a (document, JSON
    // Pointer) locator that the operation executor extracts, normalizes,
    // assembles into a standalone doc, and runs.
    const locator = await this.#locateOperation(step, stepId);

    // resolve parameters and request body against the pre-request context.
    const preContext = state.toContext();
    const parameters = this.#parameterResolver.resolve(step.parameters, (expression) =>
      this.#evaluate(preContext, expression),
    );
    const requestBody = this.#requestBodyResolver.resolve(step.requestBody, (expression) =>
      this.#evaluate(preContext, expression),
    );

    // the Arazzo-derived parameters and request body are spread after the opaque
    // executeOptions bag so they take precedence over it. the operation executor
    // then forces the operation target on top of this before executing.
    const response = await this.#operationExecutor.execute(locator, {
      ...executeOptions,
      parameters,
      ...this.#requestBodyOptions(requestBody),
    });

    // evaluate criteria, outputs, and the next action against the post-request
    // context (with $request / $url / $method and $response / $statusCode).
    const postContext = state.toContext(
      this.#requestContext(response),
      this.#responseContext(response),
    );
    const successful = this.#evaluateCriteria(step, postContext);
    const outputs = this.#outputResolver.resolve(step.outputs, (expression) =>
      this.#evaluate(postContext, expression),
    );
    const action = this.#selectAction(step, successful, postContext, defaultActions);

    return { stepId, response, successful, outputs, action };
  }

  /**
   * The request-body execute options for the step, as a typed partial to spread
   * into the client options.
   *
   * Empty when the step has no request body; the `requestContentType` key is
   * present only when a content type was resolved, so it is omitted rather than
   * spread as `undefined`.
   */
  #requestBodyOptions(
    requestBody: ResolvedRequestBody | undefined,
  ): Partial<OpenAPIOperationExecuteOptions> {
    if (requestBody === undefined) return {};

    return requestBody.contentType === undefined
      ? { requestBody: requestBody.payload }
      : { requestBody: requestBody.payload, requestContentType: requestBody.contentType };
  }

  async #locateOperation(step: StepElement, stepId: string): Promise<OpenAPIOperationLocator> {
    if (isStringElement(step.operationId)) {
      return this.#locatorNormalizer.normalizeOperationId(
        toValue(step.operationId) as string,
        this.#document,
      );
    }
    if (isStringElement(step.operationPath)) {
      return this.#locatorNormalizer.normalizeOperationPath(
        toValue(step.operationPath) as string,
        this.#document,
      );
    }
    throw new ExecutionError(`Step "${stepId}" has no operationId or operationPath`, {
      stepId,
      reason: 'missing-operation',
    });
  }

  /**
   * Evaluates the step's `successCriteria`; all criteria must pass. A step with
   * no criteria succeeds on a received response.
   */
  #evaluateCriteria(step: StepElement, context: RuntimeExpressionContext): boolean {
    const criteria = step.successCriteria;
    // no (or non-array) successCriteria: the step succeeds on a received response.
    if (!isArrayElement(criteria)) return true;

    for (const criterion of criteria) {
      if (!isCriterionElement(criterion)) continue;
      const met = this.#criterionEvaluator.evaluate(criterion, (expression) =>
        this.#evaluate(context, expression),
      );
      if (!met) return false;
    }
    return true;
  }

  /**
   * Selects the `onSuccess` / `onFailure` action for the outcome, gating each
   * action's criteria against the context.
   *
   * A step's own action list overrides the workflow-level default wholesale: the
   * step's list is used when present, otherwise the matching `defaultActions`
   * list. There is no per-action merge, and success/failure fall back
   * independently.
   */
  #selectAction(
    step: StepElement,
    successful: boolean,
    context: RuntimeExpressionContext,
    defaultActions: StepDefaultActions,
  ): SelectedAction | undefined {
    const actions = successful
      ? (step.onSuccess ?? defaultActions.onSuccess)
      : (step.onFailure ?? defaultActions.onFailure);
    return this.#actionResolver.resolve(actions, (criterion) =>
      this.#criterionEvaluator.evaluate(criterion, (expression) =>
        this.#evaluate(context, expression),
      ),
    );
  }

  /**
   * Resolves a runtime expression leniently against a context, forwarding
   * `$components` / `$sourceDescriptions` resolution to the document and
   * registry.
   */
  #evaluate(context: RuntimeExpressionContext, expression: string): unknown {
    return new RuntimeExpressionEvaluator(context, {
      strict: false,
      document: this.#document,
      registry: this.#registry,
    }).evaluate(expression);
  }

  #responseContext(response: OpenAPIOperationResponse): RuntimeExpressionResponseContext {
    return {
      statusCode: response.status,
      header: response.headers,
      body: response.body,
    };
  }

  /**
   * The request context (`$url`, `$method`, `$request.header.*`,
   * `$request.body`) from the request the client actually sent, or `undefined`
   * when the client did not report one.
   */
  #requestContext(response: OpenAPIOperationResponse): RuntimeExpressionRequestContext | undefined {
    const request = response.request;
    if (request === undefined) return undefined;
    return {
      url: request.url,
      method: request.method,
      header: request.headers,
      body: request.body,
    };
  }
}

export default StepExecutor;
