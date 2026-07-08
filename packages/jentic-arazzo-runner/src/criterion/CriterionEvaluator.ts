import { toValue } from '@speclynx/apidom-core';
import { isStringElement } from '@speclynx/apidom-datamodel';
import {
  isCriterionElement,
  isCriterionExpressionTypeElement,
  type CriterionElement,
} from '@speclynx/apidom-ns-arazzo-1';

import CriterionError from '../errors/CriterionError.ts';
import RegexCriterionEvaluator from './RegexCriterionEvaluator.ts';

/**
 * Resolves a criterion's `context` runtime expression to a value.
 *
 * A criterion condition is applied to the value this produces. It should
 * resolve leniently — an unresolvable reference returning `undefined` fails the
 * criterion, rather than throwing (a common way to drive it is
 * `(expression) => runtimeExpressionEvaluator.evaluate(expression)` with a
 * lenient evaluator).
 * @public
 */
export type CriterionContextResolver = (expression: string) => unknown;

/**
 * Options for the CriterionEvaluator.
 * @public
 */
export interface CriterionEvaluatorOptions {
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
 * The evaluator is agnostic about how a criterion's `context` runtime
 * expression is resolved: the caller supplies a {@link CriterionContextResolver}
 * per evaluation, keeping runtime-state, document, and registry concerns in the
 * runtime expression evaluator rather than duplicated here.
 * @public
 */
class CriterionEvaluator {
  readonly #regex: RegexCriterionEvaluator;

  constructor(options: CriterionEvaluatorOptions = {}) {
    this.#regex = options.regex ?? new RegexCriterionEvaluator();
  }

  /**
   * Evaluates a criterion element, returning whether the condition is met.
   *
   * `resolve` produces the value a non-`simple` condition is applied to, from
   * the criterion's `context` runtime expression.
   */
  evaluate(criterion: CriterionElement, resolve: CriterionContextResolver): boolean {
    if (!isCriterionElement(criterion)) {
      throw new CriterionError('Element is not a Criterion Object', {
        reason: 'invalid-criterion',
      });
    }

    const condition = isStringElement(criterion.condition)
      ? (toValue(criterion.condition) as string)
      : undefined;
    // `condition` is required; an empty string is not a meaningful condition
    // (e.g. an empty regex would match unconditionally), so reject it too.
    if (condition === undefined || condition === '') {
      throw new CriterionError('Criterion is missing a "condition"', {
        reason: 'missing-condition',
      });
    }

    const type = this.#resolveType(criterion);

    switch (type) {
      case 'regex':
        return this.#regex.evaluate(condition, this.#resolveContext(criterion, type, resolve));
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
   * Determines the criterion `type`, defaulting to `simple` only when the field
   * is omitted. The `type` field may be a bare string or a Criterion Expression
   * Type Object (whose own `type` names the flavor). A present-but-unreadable
   * `type` throws a {@link CriterionError} rather than silently defaulting.
   */
  #resolveType(criterion: CriterionElement): string {
    const type = criterion.type;
    if (type === undefined) return 'simple';
    if (isCriterionExpressionTypeElement(type) && isStringElement(type.type)) {
      return toValue(type.type) as string;
    }
    if (isStringElement(type)) return toValue(type) as string;
    throw new CriterionError('Criterion has an invalid "type"', { reason: 'invalid-type' });
  }

  /**
   * Resolves the criterion's `context` runtime expression to the value the
   * condition is applied to. The condition types that need a context (`regex`,
   * `jsonpath`, `xpath`) must declare one; a criterion of such a type without a
   * `context` throws a {@link CriterionError}.
   */
  #resolveContext(
    criterion: CriterionElement,
    type: string,
    resolve: CriterionContextResolver,
  ): unknown {
    if (!isStringElement(criterion.context)) {
      throw new CriterionError(`Criterion type "${type}" requires a "context"`, {
        type,
        reason: 'missing-context',
      });
    }
    return resolve(toValue(criterion.context) as string);
  }
}

export default CriterionEvaluator;
