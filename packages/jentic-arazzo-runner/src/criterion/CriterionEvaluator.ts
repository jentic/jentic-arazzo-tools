import { toValue } from '@speclynx/apidom-core';
import { isStringElement } from '@speclynx/apidom-datamodel';
import {
  isCriterionElement,
  isCriterionExpressionTypeElement,
  type CriterionElement,
} from '@speclynx/apidom-ns-arazzo-1';

import CriterionError from '../errors/CriterionError.ts';
import type ArazzoDocument from '../document/ArazzoDocument.ts';
import type DocumentRegistry from '../registry/DocumentRegistry.ts';
import RuntimeExpressionEvaluator from '../expression/RuntimeExpressionEvaluator.ts';
import type { RuntimeExpressionContext } from '../expression/RuntimeExpressionContext.ts';
import RegexCriterionEvaluator from './RegexCriterionEvaluator.ts';

/**
 * Options for the CriterionEvaluator.
 * @public
 */
export interface CriterionEvaluatorOptions {
  /**
   * The runtime state that a criterion's `context` runtime expression is
   * resolved against.
   */
  readonly context?: RuntimeExpressionContext;
  /**
   * The Arazzo document, forwarded to the runtime expression evaluator to
   * resolve `$components` / `$sourceDescriptions` in a criterion's `context`.
   */
  readonly document?: ArazzoDocument;
  /**
   * The document registry, forwarded to the runtime expression evaluator to
   * reach documents referenced by `$sourceDescriptions`.
   */
  readonly registry?: DocumentRegistry;
  /**
   * Regex condition evaluator. Injectable for testing.
   */
  readonly regex?: RegexCriterionEvaluator;
}

/**
 * Evaluates an Arazzo Criterion Object to a boolean.
 *
 * Dispatches on the criterion's `type` (defaulting to `simple` when omitted):
 * - `regex` — resolves the `context` runtime expression, then applies the
 *   pattern to the resolved value.
 * - `simple`, `jsonpath`, `xpath` — not yet implemented.
 *
 * For the non-`simple` types the `context` is a runtime expression whose
 * resolved value the condition is applied to; it is resolved leniently, so an
 * unresolvable context yields `undefined` and fails the criterion rather than
 * throwing.
 * @public
 */
class CriterionEvaluator {
  readonly #context: RuntimeExpressionContext;
  readonly #document?: ArazzoDocument;
  readonly #registry?: DocumentRegistry;
  readonly #regex: RegexCriterionEvaluator;

  constructor(options: CriterionEvaluatorOptions = {}) {
    this.#context = options.context ?? {};
    this.#document = options.document;
    this.#registry = options.registry;
    this.#regex = options.regex ?? new RegexCriterionEvaluator();
  }

  /**
   * Evaluates a criterion element, returning whether the condition is met.
   */
  evaluate(criterion: CriterionElement): boolean {
    if (!isCriterionElement(criterion)) {
      throw new CriterionError('Element is not a Criterion Object', {
        reason: 'invalid-criterion',
      });
    }

    const condition = isStringElement(criterion.condition)
      ? (toValue(criterion.condition) as string)
      : undefined;
    if (condition === undefined) {
      throw new CriterionError('Criterion is missing a "condition"', {
        reason: 'missing-condition',
      });
    }

    const type = this.#resolveType(criterion);

    switch (type) {
      case 'regex':
        return this.#regex.evaluate(condition, this.#resolveContext(criterion, type));
      case 'simple':
      case 'jsonpath':
      case 'xpath':
        throw new CriterionError(`Criterion type "${type}" is not yet supported`, {
          condition,
          type,
          reason: 'unsupported-type',
        });
      default:
        throw new CriterionError(`Unknown criterion type "${type}"`, {
          condition,
          type,
          reason: 'unknown-type',
        });
    }
  }

  /**
   * Determines the criterion `type`, defaulting to `simple` when omitted. The
   * `type` field may be a bare string or a Criterion Expression Type Object
   * (whose own `type` names the flavor).
   */
  #resolveType(criterion: CriterionElement): string {
    const type = criterion.type;
    if (isCriterionExpressionTypeElement(type) && isStringElement(type.type)) {
      return toValue(type.type) as string;
    }
    if (isStringElement(type)) return toValue(type) as string;
    return 'simple';
  }

  /**
   * Resolves the criterion's `context` runtime expression against the runtime
   * state. The condition types that need a context (`regex`, `jsonpath`,
   * `xpath`) must declare one; a missing context resolves to `undefined` and
   * fails the criterion downstream.
   */
  #resolveContext(criterion: CriterionElement, type: string): unknown {
    if (!isStringElement(criterion.context)) {
      throw new CriterionError(`Criterion type "${type}" requires a "context"`, {
        type,
        reason: 'missing-context',
      });
    }
    const evaluator = new RuntimeExpressionEvaluator(this.#context, {
      strict: false,
      document: this.#document,
      registry: this.#registry,
    });
    return evaluator.evaluate(toValue(criterion.context) as string);
  }
}

export default CriterionEvaluator;
