import { toValue } from '@speclynx/apidom-core';
import { isStringElement } from '@speclynx/apidom-datamodel';
import { parse as parseJSONPointer, testJSONPointer } from '@swaggerexpert/json-pointer';
import { isPayloadReplacementElement, type RequestBodyElement } from '@speclynx/apidom-ns-arazzo-1';
import { test as isRuntimeExpression } from '@swaggerexpert/arazzo-runtime-expression';

import ResolverError from '../errors/ResolverError.ts';

/**
 * Resolves a runtime expression to its value, bridged to a lenient runtime
 * expression evaluator.
 * @public
 */
export type RequestBodyValueResolver = (expression: string) => unknown;

/**
 * A resolved request body: the payload with all replacements applied, plus the
 * declared content type when present.
 * @public
 */
export interface ResolvedRequestBody {
  readonly payload: unknown;
  readonly contentType?: string;
}

/**
 * Resolves a step's `requestBody` to a concrete payload.
 *
 * The `payload` is resolved first: a string that is a whole runtime expression
 * is evaluated to its typed value, any other string is a literal, and a
 * non-string payload (object, array, scalar) is used as-is. Then each
 * `replacements` entry is applied — its `value` is resolved (a whole runtime
 * expression is evaluated, otherwise it is a literal) and set into the payload
 * at the replacement's `target` JSON Pointer.
 *
 * `target` may be a JSON Pointer or an XPath per the specification; only JSON
 * Pointer targets are supported — an XPath target throws {@link ResolverError}.
 * @public
 */
class RequestBodyResolver {
  /**
   * Resolves the request body, returning its payload and content type. Returns
   * `undefined` when there is no request body.
   */
  resolve(
    requestBody: RequestBodyElement | undefined,
    resolve: RequestBodyValueResolver,
  ): ResolvedRequestBody | undefined {
    if (requestBody === undefined) return undefined;

    let payload = this.#resolveValue(requestBody.payload, resolve);

    if (requestBody.replacements !== undefined) {
      for (const replacement of requestBody.replacements) {
        if (!isPayloadReplacementElement(replacement)) continue;
        const target = toValue(replacement.target) as string | undefined;
        if (typeof target !== 'string') continue;
        payload = this.#applyReplacement(
          payload,
          target,
          this.#resolveValue(replacement.value, resolve),
        );
      }
    }

    const contentType = isStringElement(requestBody.contentType)
      ? (toValue(requestBody.contentType) as string)
      : undefined;

    return contentType === undefined ? { payload } : { payload, contentType };
  }

  /**
   * Resolves a payload or replacement value element: a whole runtime expression
   * string is evaluated, every other value (a non-expression string, or a
   * non-string literal) is used as-is.
   */
  #resolveValue(value: unknown, resolve: RequestBodyValueResolver): unknown {
    const resolved = toValue(value);
    return typeof resolved === 'string' && isRuntimeExpression(resolved)
      ? resolve(resolved)
      : resolved;
  }

  /**
   * Sets `value` into `payload` at the `target` JSON Pointer, returning the
   * updated payload. Throws {@link ResolverError} for an XPath target (not
   * supported) or a target that does not resolve within the payload.
   */
  #applyReplacement(payload: unknown, target: string, value: unknown): unknown {
    if (!testJSONPointer(target)) {
      throw new ResolverError(
        `Unsupported requestBody replacement target "${target}" (expected JSON Pointer)`,
        {
          target,
          reason: 'unsupported-target',
        },
      );
    }

    const tokens = parseJSONPointer(target).tree as string[];

    // whole-document replacement: an empty pointer targets the payload root.
    if (tokens.length === 0) return value;

    if (typeof payload !== 'object' || payload === null) {
      throw new ResolverError(
        `requestBody replacement target "${target}" does not resolve in the payload`,
        {
          target,
          reason: 'unresolved-target',
        },
      );
    }

    let current = payload as Record<string, unknown> | unknown[];
    for (let index = 0; index < tokens.length - 1; index += 1) {
      const next = (current as Record<string, unknown>)[tokens[index]];
      if (typeof next !== 'object' || next === null) {
        throw new ResolverError(
          `requestBody replacement target "${target}" does not resolve in the payload`,
          {
            target,
            reason: 'unresolved-target',
          },
        );
      }
      current = next as Record<string, unknown> | unknown[];
    }
    (current as Record<string, unknown>)[tokens[tokens.length - 1]] = value;

    return payload;
  }
}

export default RequestBodyResolver;
