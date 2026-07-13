import { toValue } from '@speclynx/apidom-core';
import { isArrayElement, isStringElement } from '@speclynx/apidom-datamodel';
import { isCriterionElement, type StepElement } from '@speclynx/apidom-ns-arazzo-1';

import type ArazzoDocument from '../document/ArazzoDocument.ts';
import type DocumentRegistry from '../registry/DocumentRegistry.ts';
import type OpenAPIClient from '../client/OpenAPIClient.ts';
import type { OpenAPIOperationExecuteOptions } from '../client/OpenAPIClient.ts';
import type OpenAPIDocument from '../document/OpenAPIDocument.ts';
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
import OpenAPIOperationExtractor from '../extractor/OpenAPIOperationExtractor.ts';
import OpenAPIOperationNormalizer from '../normalizer/OpenAPIOperationNormalizer.ts';
import OpenAPIDocumentAssembler from '../assembler/OpenAPIDocumentAssembler.ts';
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
 * Builds the OpenAPI client for a step's assembled operation document.
 * @public
 */
export type OpenAPIClientFactory = (document: OpenAPIDocument) => OpenAPIClient;

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
   * Builds the client that executes the assembled operation.
   */
  readonly clientFactory: OpenAPIClientFactory;
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
 * assembles a standalone OpenAPI document for it, resolves the
 * step's parameters and request body against the pre-request context, executes
 * the operation, then evaluates `successCriteria`, resolves `outputs`, and
 * selects the `onSuccess`/`onFailure` action against the post-request context.
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
  readonly #document: ArazzoDocument;
  readonly #registry: DocumentRegistry;
  readonly #clientFactory: OpenAPIClientFactory;
  readonly #locatorNormalizer: OpenAPIOperationLocatorNormalizer;
  readonly #operationExtractor = new OpenAPIOperationExtractor();
  readonly #operationNormalizer = new OpenAPIOperationNormalizer();
  readonly #documentAssembler = new OpenAPIDocumentAssembler();
  readonly #parameterResolver = new ParameterResolver();
  readonly #requestBodyResolver = new RequestBodyResolver();
  readonly #outputResolver = new OutputResolver();
  readonly #criterionEvaluator = new CriterionEvaluator();
  readonly #actionResolver = new ActionResolver();

  constructor(options: StepExecutorOptions) {
    this.#document = options.document;
    this.#registry = options.registry;
    this.#clientFactory = options.clientFactory;
    this.#locatorNormalizer = new OpenAPIOperationLocatorNormalizer(options.registry);
  }

  /**
   * Executes the step against the given run state, returning its outcome.
   *
   * `executeOptions` is an opaque bag of client-specific execute options passed
   * through to the client (e.g. a swagger client's `contextUrl` base URL for a
   * relative server, or an `AbortSignal`). The Arazzo-derived options
   * (`operationId`, `parameters`, `requestBody`) always take precedence over it.
   */
  async execute(
    step: StepElement,
    state: ContextSource,
    executeOptions: Record<string, unknown> = {},
  ): Promise<StepExecutionResult> {
    const stepId = toValue(step.stepId) as string;

    // operationId, operationPath, and workflowId are mutually exclusive; a step
    // declaring more than one is malformed and has no defined resolution.
    const targets = [step.operationId, step.operationPath, step.workflowId].filter((field) =>
      isStringElement(field),
    );
    if (targets.length > 1) {
      throw new ExecutionError(
        `Step "${stepId}" declares more than one of operationId, operationPath, workflowId (mutually exclusive)`,
        { stepId, reason: 'ambiguous-target' },
      );
    }

    if (isStringElement(step.workflowId)) {
      throw new ExecutionError(`Step "${stepId}" targets a workflowId; use the workflow executor`, {
        stepId,
        reason: 'workflow-step',
      });
    }

    // locate which operation the step invokes — reduced to (document, JSON
    // Pointer) — then extract, normalize, and assemble a standalone doc.
    const locator = await this.#locateOperation(step, stepId);
    const operation = this.#operationExtractor.extractByPointer(
      locator.document,
      locator.jsonPointer,
    );
    const normalizedOperation = await this.#operationNormalizer.normalize(
      operation,
      locator.document,
    );
    const assembled = this.#documentAssembler.assemble(normalizedOperation, locator.document);
    const client = this.#clientFactory(assembled);

    // resolve parameters and request body against the pre-request context.
    const preContext = state.toContext();
    const parameters = this.#parameterResolver.resolve(step.parameters, (expression) =>
      this.#evaluate(preContext, expression),
    );
    const requestBody = this.#requestBodyResolver.resolve(step.requestBody, (expression) =>
      this.#evaluate(preContext, expression),
    );

    const response = await client.execute(
      this.#buildExecuteOptions(executeOptions, locator, parameters, requestBody),
    );

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
    const action = this.#selectAction(step, successful, postContext);

    return { stepId, response, successful, outputs, action };
  }

  /**
   * Builds the client execute options.
   *
   * The Arazzo-derived options (the operation JSON Pointer, parameters, and
   * request body) are applied after the opaque `executeOptions` bag so they
   * always take precedence. The locator's JSON Pointer selects the operation in
   * the assembled document (the assembler preserves its path/method) and is
   * passed as `operationPath`; `operationId` is cleared so an `executeOptions`
   * passthrough cannot hijack the operation.
   */
  #buildExecuteOptions(
    executeOptions: Record<string, unknown>,
    locator: OpenAPIOperationLocator,
    parameters: Record<string, unknown>,
    requestBody: ResolvedRequestBody | undefined,
  ): OpenAPIOperationExecuteOptions {
    const options: Record<string, unknown> = {
      ...executeOptions,
      operationId: undefined,
      operationPath: locator.jsonPointer,
      parameters,
    };

    if (requestBody !== undefined) {
      options.requestBody = requestBody.payload;
      if (requestBody.contentType !== undefined) {
        options.requestContentType = requestBody.contentType;
      }
    }

    return options;
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
   */
  #selectAction(
    step: StepElement,
    successful: boolean,
    context: RuntimeExpressionContext,
  ): SelectedAction | undefined {
    const actions = successful ? step.onSuccess : step.onFailure;
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
