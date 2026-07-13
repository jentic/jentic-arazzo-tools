import {
  parse,
  test,
  interpolate,
  type ASTNode,
  type RequestExpression,
  type ResponseExpression,
  type Source,
} from '@swaggerexpert/arazzo-runtime-expression';
import {
  compile,
  composeRealms,
  evaluate as evaluateJSONPointer,
  JSONPointerEvaluateError,
} from '@swaggerexpert/json-pointer';
import JSONEvaluationRealm from '@swaggerexpert/json-pointer/evaluate/realms/json';
import { ApiDOMEvaluationRealm } from '@speclynx/apidom-json-pointer';
import { toValue } from '@speclynx/apidom-core';

import RuntimeExpressionError from '../errors/RuntimeExpressionError.ts';
import type DocumentRegistry from '../registry/DocumentRegistry.ts';
import type APIDocument from '../document/APIDocument.ts';
import ArazzoDocument from '../document/ArazzoDocument.ts';
import OpenAPIDocument from '../document/OpenAPIDocument.ts';
import type { RuntimeExpressionContext } from './RuntimeExpressionContext.ts';

/**
 * Options for the RuntimeExpressionEvaluator.
 * @public
 */
export interface RuntimeExpressionEvaluatorOptions {
  /**
   * When `true` (default), an unresolvable reference throws a
   * RuntimeExpressionError. When `false`, unresolvable references evaluate to
   * `undefined`. Parse failures always throw regardless of this setting.
   */
  readonly strict?: boolean;
  /**
   * The Arazzo document the expression is evaluated within. Required to resolve
   * `$components.{field}.{name}` (read from this document) and
   * `$sourceDescriptions.{name}.{reference}` (whose source name is resolved
   * against this document). Absent references resolve to `undefined`.
   */
  readonly document?: ArazzoDocument;
  /**
   * The document registry, used to reach the external document a
   * `$sourceDescriptions` reference points at. The referenced document must
   * already be loaded — resolution is synchronous and never triggers a fetch.
   */
  readonly registry?: DocumentRegistry;
}

/**
 * The request/response side of the context a `$request`/`$response` source is
 * evaluated against. Both request and response contexts are assignable to this
 * shape; sources absent from a side (e.g. `$response.query`) resolve to
 * `undefined` naturally.
 */
type MessageContext = {
  readonly header?: Record<string, unknown>;
  readonly query?: Record<string, unknown>;
  readonly path?: Record<string, unknown>;
  readonly body?: unknown;
};

/**
 * Realm for drilling JSON Pointers into payload values. Composing the ApiDOM
 * realm ahead of the JSON realm lets a single `evaluate` call handle plain JS
 * values, ApiDOM elements, and mixed trees: the ApiDOM realm claims elements
 * and falls through to the JSON realm for plain values. Order matters — the
 * JSON realm would otherwise greedily claim ApiDOM elements and fail.
 */
const pointerRealm = composeRealms(new ApiDOMEvaluationRealm(), new JSONEvaluationRealm());

/**
 * Evaluates Arazzo runtime expressions against a context.
 *
 * A single evaluator is bound to one context and can evaluate many expressions
 * against it — matching how a step executor resolves a step's parameters,
 * success criteria, and outputs from the same state.
 *
 * The context holds only runtime state (`$inputs`, `$steps`, `$request`,
 * `$response`, …). Static, document-sourced expressions are resolved on demand:
 * `$components` from the evaluator's document, and `$sourceDescriptions` from
 * the external document (via the registry) the source name points at.
 *
 * A reference resolves to `undefined` when it is absent. Runtime values
 * originate from JSON (or ApiDOM), which cannot represent `undefined` — an
 * absent value is a missing property and an explicit null is `null` — so
 * `undefined` unambiguously marks "unresolved".
 *
 * Three modes are supported:
 * - {@link RuntimeExpressionEvaluator.evaluate} resolves a pure expression
 *   (e.g. `$response.body#/id`) to its typed value.
 * - {@link RuntimeExpressionEvaluator.interpolate} renders a template with
 *   embedded `{expression}` occurrences to a string.
 * - {@link RuntimeExpressionEvaluator.resolve} applies Arazzo "value" semantics:
 *   a value that is itself a complete expression resolves to a typed value,
 *   otherwise the value is interpolated to a string.
 * @public
 */
class RuntimeExpressionEvaluator {
  readonly #context: RuntimeExpressionContext;
  readonly #strict: boolean;
  readonly #document?: ArazzoDocument;
  readonly #registry?: DocumentRegistry;

  constructor(context: RuntimeExpressionContext, options: RuntimeExpressionEvaluatorOptions = {}) {
    this.#context = context;
    this.#strict = options.strict ?? true;
    this.#document = options.document;
    this.#registry = options.registry;
  }

  /**
   * Evaluates a pure runtime expression to its typed value.
   *
   * The expression must be the bare form without surrounding braces
   * (e.g. `$inputs.username`, `$response.body#/pets/0/id`). In strict mode an
   * unresolvable reference throws; otherwise it returns `undefined`.
   */
  evaluate(expression: string): unknown {
    const value = this.#evaluateNode(this.#parse(expression), expression);
    if (value === undefined && this.#strict) {
      throw new RuntimeExpressionError(
        `Runtime expression "${expression}" could not be resolved against the context`,
        { expression, reason: 'unresolved-reference' },
      );
    }
    return value;
  }

  /**
   * Renders a template string, replacing each embedded `{expression}` with the
   * string form of its evaluated value. Returns a string.
   *
   * Object and array values are serialized with `JSON.stringify`. In non-strict
   * mode, unresolvable references render as an empty string. A `{…}` that is not
   * a valid embedded expression (e.g. a literal JSON payload) is left unchanged.
   */
  interpolate(template: string): string {
    return interpolate(template, (expression) => this.evaluate(expression));
  }

  /**
   * Resolves an Arazzo "value" string.
   *
   * A value that is itself a complete runtime expression (the unbraced form,
   * e.g. `$inputs.userId`) resolves to its typed value — "runtime expressions
   * preserve the type of the referenced value". Any other string is an
   * expression-string template: embedded `{expression}` occurrences are
   * interpolated and a string is returned, so a whole-string `{expression}`
   * yields the string representation of its value, not the typed value. A
   * string containing no expressions is returned unchanged.
   */
  resolve(value: string): unknown {
    // `test` returns true only when the entire string is a valid runtime
    // expression, so a braced or mixed string falls through to interpolation.
    return test(value) ? this.evaluate(value) : this.interpolate(value);
  }

  /**
   * Parses an expression to its AST, throwing on failure regardless of strict mode.
   */
  #parse(expression: string): ASTNode {
    let result: ReturnType<typeof parse>;
    try {
      result = parse(expression);
    } catch (error: unknown) {
      throw new RuntimeExpressionError(`Failed to parse runtime expression "${expression}"`, {
        cause: error,
        expression,
        reason: 'parse-error',
      });
    }

    if (!result.result.success || result.tree === undefined) {
      throw new RuntimeExpressionError(`Invalid runtime expression "${expression}"`, {
        expression,
        reason: 'invalid-expression',
      });
    }

    return result.tree;
  }

  /**
   * Walks an AST node against the context, returning the referenced value or
   * `undefined` when the reference does not resolve.
   */
  #evaluateNode(node: ASTNode, expression: string): unknown {
    switch (node.type) {
      case 'UrlExpression':
        return this.#context.request?.url;
      case 'MethodExpression':
        return this.#context.request?.method;
      case 'StatusCodeExpression':
        return this.#context.response?.statusCode;
      case 'RequestExpression':
        return this.#source((node as RequestExpression).source, this.#context.request);
      case 'ResponseExpression':
        return this.#source((node as ResponseExpression).source, this.#context.response);
      case 'InputsExpression':
        return this.#drill(this.#get(this.#context.inputs, node.name));
      case 'OutputsExpression':
        return this.#drill(this.#get(this.#context.outputs, node.name));
      case 'StepsExpression':
        return this.#drill(
          this.#get(this.#context.steps?.[node.stepId]?.outputs, node.outputName),
          node.jsonPointer?.value,
        );
      case 'WorkflowsExpression':
        return this.#drill(
          this.#get(this.#context.workflows?.[node.workflowId]?.[node.field], node.fieldName),
          node.jsonPointer?.value,
        );
      case 'SourceDescriptionsExpression':
        return this.#sourceDescription(node.sourceName, node.reference);
      case 'ComponentsExpression':
        return this.#component(node.componentType, node.componentName);
      default:
        throw new RuntimeExpressionError(
          `Unsupported runtime expression node "${(node as ASTNode).type}"`,
          { expression, reason: 'unsupported-node' },
        );
    }
  }

  /**
   * Evaluates a `$request`/`$response` source reference against the request or
   * response side of the context.
   */
  #source(source: Source, message: MessageContext | undefined): unknown {
    const { reference } = source;
    switch (reference.type) {
      case 'HeaderReference':
        return this.#header(message?.header, reference.token);
      case 'QueryReference':
        return this.#get(message?.query, reference.name);
      case 'PathReference':
        return this.#get(message?.path, reference.name);
      case 'BodyReference':
        return this.#drill(message?.body, reference.jsonPointer?.value);
      default:
        return undefined;
    }
  }

  /**
   * Resolves `$components.{field}.{name}` by drilling into the evaluator's
   * document. Returns `undefined` when no document is configured or the
   * component is absent.
   */
  #component(field: string, name: string): unknown {
    return this.#drillDocument(this.#document, compile(['components', field, name]));
  }

  /**
   * Resolves `$sourceDescriptions.{name}.{reference}` with the resolution
   * priority defined by the Arazzo Specification:
   *
   * 1. `{reference}` is matched as an operationId (OpenAPI source) or workflowId
   *    (Arazzo source) in the referenced document, resolving to that operation
   *    or workflow.
   * 2. failing that, `{reference}` is matched as a field of the Source
   *    Description Object itself (e.g. `url`, `type`) — so
   *    `$sourceDescriptions.{name}.url` yields the source's URL. An operationId
   *    that collides with a field name takes precedence (tier 1 wins).
   *
   * Returns `undefined` when nothing matches.
   */
  #sourceDescription(sourceName: string, reference: string): unknown {
    const uri = this.#document?.resolveSourceDescriptionURI(sourceName);

    // tier 1: operationId / workflowId in the referenced document.
    const apiDocument = uri === undefined ? undefined : this.#registry?.get(uri);
    if (apiDocument !== undefined) {
      const pointer = OpenAPIDocument.is(apiDocument)
        ? apiDocument.operationIndex.get(reference)
        : ArazzoDocument.is(apiDocument)
          ? apiDocument.workflowIndex.get(reference)
          : undefined;
      if (pointer !== undefined) return this.#drillDocument(apiDocument, pointer);
    }

    // tier 2: a field of the Source Description Object (url, type, ...).
    return this.#document?.resolveSourceDescriptionField(sourceName, reference);
  }

  /**
   * Reads a property from a context slot, or `undefined` when the slot is not
   * an object or lacks the key. Own properties only, so prototype members
   * (`constructor`, `toString`) never leak into a resolution.
   */
  #get(slot: unknown, key: string): unknown {
    if (typeof slot !== 'object' || slot === null) return undefined;
    if (!Object.hasOwn(slot, key)) return undefined;
    return (slot as Record<string, unknown>)[key];
  }

  /**
   * Reads a header case-insensitively. The parser already lowercases the header
   * token, so only the context keys (populated from an HTTP response with
   * arbitrary casing) need normalizing to match.
   */
  #header(headers: Record<string, unknown> | undefined, token: string): unknown {
    if (headers === undefined) return undefined;
    const key = Object.keys(headers).find((k) => k.toLowerCase() === token);
    return key === undefined ? undefined : headers[key];
  }

  /**
   * Drills a JSON Pointer into a document's API element. Returns `undefined`
   * when the document is absent or the pointer does not resolve.
   */
  #drillDocument(document: APIDocument | undefined, pointer: string): unknown {
    return document === undefined ? undefined : this.#drill(document.parseResult.api, pointer);
  }

  /**
   * Drills an optional JSON Pointer into a payload value, returning the plain
   * runtime value. `toValue` is idempotent on plain values, so the leaf is plain
   * whether the payload was JSON or an ApiDOM element (see `pointerRealm`).
   */
  #drill(value: unknown, pointer?: string): unknown {
    if (value === undefined) return undefined;
    if (pointer === undefined) return toValue(value);
    try {
      return toValue(evaluateJSONPointer(value, pointer, { realm: pointerRealm }));
    } catch (error: unknown) {
      if (error instanceof JSONPointerEvaluateError) return undefined;
      throw error;
    }
  }
}

export default RuntimeExpressionEvaluator;
