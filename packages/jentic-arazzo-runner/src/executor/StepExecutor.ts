import { toValue } from '@speclynx/apidom-core';
import { isStringElement } from '@speclynx/apidom-datamodel';
import { isCriterionElement, type StepElement } from '@speclynx/apidom-ns-arazzo-1';

import type ArazzoDocument from '../document/ArazzoDocument.ts';
import type DocumentRegistry from '../registry/DocumentRegistry.ts';
import type OpenAPIClient from '../client/OpenAPIClient.ts';
import type OpenAPIDocument from '../document/OpenAPIDocument.ts';
import type OpenAPIOperationResponse from '../client/OpenAPIOperationResponse.ts';
import type {
  RuntimeExpressionContext,
  RuntimeExpressionResponseContext,
} from '../expression/RuntimeExpressionContext.ts';
import RuntimeExpressionEvaluator from '../expression/RuntimeExpressionEvaluator.ts';
import CriterionEvaluator from '../criterion/CriterionEvaluator.ts';
import ParameterResolver from '../resolver/ParameterResolver.ts';
import RequestBodyResolver from '../resolver/RequestBodyResolver.ts';
import OutputResolver from '../resolver/OutputResolver.ts';
import ActionResolver, { type SelectedAction } from '../action/ActionResolver.ts';
import OpenAPIOperationNormalizer from '../normalizer/OpenAPIOperationNormalizer.ts';
import OpenAPIDocumentAssembler from '../assembler/OpenAPIDocumentAssembler.ts';
import OpenAPIOperationTargetResolver, {
  type OpenAPIOperationTarget,
} from './OpenAPIOperationTargetResolver.ts';
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
   * operation target against its source descriptions, and to resolve
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
 * The pipeline resolves the step's operation target (`operationId` /
 * `operationPath`), assembles a standalone OpenAPI document for it, resolves the
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
  readonly #targetResolver: OpenAPIOperationTargetResolver;
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
    this.#targetResolver = new OpenAPIOperationTargetResolver(options.registry);
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

    // resolve which operation the step invokes and assemble a standalone doc.
    const target = await this.#resolveTarget(step, stepId);
    const normalizedOperation = await this.#operationNormalizer.normalize(
      target.operation,
      target.document,
    );
    const assembled = this.#documentAssembler.assemble(normalizedOperation, target.document);
    const client = this.#clientFactory(assembled);

    // resolve parameters and request body against the pre-request context.
    const preContext = state.toContext();
    const parameters = this.#parameterResolver.resolve(step.parameters, (expression) =>
      this.#evaluate(preContext, expression),
    );
    const requestBody = this.#requestBodyResolver.resolve(step.requestBody, (expression) =>
      this.#evaluate(preContext, expression),
    );

    // Arazzo-derived options (the resolved operationPath, parameters, and
    // request body) are spread last so they always override the opaque
    // executeOptions bag. every step form — plain operationId,
    // `$sourceDescriptions` expression, or operationPath — is normalized by the
    // resolver to a single client mechanism: the operationPath JSON Pointer. it
    // comes from the resolved target, not the raw step field, and operationId is
    // cleared so an executeOptions passthrough cannot hijack the target.
    const response = await client.execute({
      ...executeOptions,
      operationId: undefined,
      operationPath: target.operationPath,
      parameters,
      ...(requestBody === undefined
        ? {}
        : {
            requestBody: requestBody.payload,
            ...(requestBody.contentType === undefined
              ? {}
              : { requestContentType: requestBody.contentType }),
          }),
    });

    // evaluate criteria, outputs, and the next action against the post-request
    // context (with $response / $statusCode).
    const postContext = state.toContext(undefined, this.#responseContext(response));
    const successful = this.#evaluateCriteria(step, postContext);
    const outputs = this.#outputResolver.resolve(step.outputs, (expression) =>
      this.#evaluate(postContext, expression),
    );
    const action = this.#selectAction(step, successful, postContext);

    return { stepId, response, successful, outputs, action };
  }

  async #resolveTarget(step: StepElement, stepId: string): Promise<OpenAPIOperationTarget> {
    if (isStringElement(step.operationId)) {
      return this.#targetResolver.resolveOperationId(
        toValue(step.operationId) as string,
        this.#document,
      );
    }
    if (isStringElement(step.operationPath)) {
      return this.#targetResolver.resolveOperationPath(
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
    if (criteria === undefined) return true;

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
}

export default StepExecutor;
