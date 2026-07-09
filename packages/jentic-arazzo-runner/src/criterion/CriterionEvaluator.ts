import { toValue } from '@speclynx/apidom-core';
import { isStringElement } from '@speclynx/apidom-datamodel';
import {
  isCriterionElement,
  isCriterionExpressionTypeElement,
  type CriterionElement,
} from '@speclynx/apidom-ns-arazzo-1';

import CriterionError from '../errors/CriterionError.ts';
import RegexCriterionEvaluator from './RegexCriterionEvaluator.ts';
import SimpleCriterionEvaluator from './SimpleCriterionEvaluator.ts';
import JSONPathCriterionEvaluator from './JSONPathCriterionEvaluator.ts';
import XPathCriterionEvaluator from './XPathCriterionEvaluator.ts';

/**
 * Resolves a runtime expression to a value during criterion evaluation.
 *
 * Used both for a criterion's `context` (regex/jsonpath/xpath) and for the
 * expressions embedded in a `simple` condition. It should resolve leniently —
 * an unresolvable reference returning `undefined` fails the criterion rather
 * than throwing (a common way to drive it is
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
   * Simple condition evaluator. Injectable for testing.
   */
  readonly simple?: SimpleCriterionEvaluator;
  /**
   * Regex condition evaluator. Injectable for testing.
   */
  readonly regex?: RegexCriterionEvaluator;
  /**
   * JSONPath condition evaluator. Injectable for testing.
   */
  readonly jsonpath?: JSONPathCriterionEvaluator;
  /**
   * XPath condition evaluator. Injectable for testing.
   */
  readonly xpath?: XPathCriterionEvaluator;
}

/**
 * Evaluates an Arazzo Criterion Object to a boolean.
 *
 * Dispatches on the criterion's `type` (defaulting to `simple` when omitted):
 * - `simple` — evaluates the condition directly, resolving the runtime
 *   expressions embedded in it.
 * - `regex` — resolves the `context` runtime expression, then applies the
 *   pattern to the resolved value.
 * - `jsonpath` — resolves the `context` runtime expression, then applies the
 *   JSONPath query to the resolved value (met when the query matches). Only the
 *   `rfc9535` version is supported (the spec default); an explicit other version
 *   throws.
 * - `xpath` — resolves the `context` runtime expression, then applies the XPath
 *   3.1 query to the resolved XML value (met by the Effective Boolean Value).
 *   Only the `xpath-31` version is supported (the spec default); an explicit
 *   other version throws.
 *
 * The evaluator is agnostic about how runtime expressions are resolved: the
 * caller supplies a {@link CriterionContextResolver} per evaluation, keeping
 * runtime-state, document, and registry concerns in the runtime expression
 * evaluator rather than duplicated here.
 * @public
 */
class CriterionEvaluator {
  readonly #simple: SimpleCriterionEvaluator;
  readonly #regex: RegexCriterionEvaluator;
  readonly #jsonpath: JSONPathCriterionEvaluator;
  readonly #xpath: XPathCriterionEvaluator;

  constructor(options: CriterionEvaluatorOptions = {}) {
    this.#simple = options.simple ?? new SimpleCriterionEvaluator();
    this.#regex = options.regex ?? new RegexCriterionEvaluator();
    this.#jsonpath = options.jsonpath ?? new JSONPathCriterionEvaluator();
    this.#xpath = options.xpath ?? new XPathCriterionEvaluator();
  }

  /**
   * Evaluates a criterion element, returning whether the condition is met.
   *
   * `resolve` turns a runtime expression into a value: for `simple` it resolves
   * the expressions embedded in the condition; for the other types it resolves
   * the criterion's `context` expression that the condition is applied to.
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
      case 'simple':
        return this.#simple.evaluate(condition, resolve);
      case 'regex':
        return this.#regex.evaluate(condition, this.#resolveContext(criterion, type, resolve));
      case 'jsonpath':
        // only rfc9535 is supported; it is the spec default, so an omitted
        // version is accepted. draft-goessner has different semantics and is
        // rejected rather than mis-evaluated.
        this.#requireVersion(criterion, type, condition, 'rfc9535');
        return this.#jsonpath.evaluate(condition, this.#resolveContext(criterion, type, resolve));
      case 'xpath':
        // only XPath 3.1 is supported; xpath-31 is the spec default, so an
        // omitted version is accepted. Older versions are rejected.
        this.#requireVersion(criterion, type, condition, 'xpath-31');
        return this.#xpath.evaluate(condition, this.#resolveContext(criterion, type, resolve));
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
   * Extracts the expression `version` from a Criterion Expression Type Object,
   * or `undefined` when no version is declared (a bare-string `type`, or a type
   * object without a `version`) — in which case the spec default for the type
   * applies. A `version` that is present but not a string is malformed and
   * throws a {@link CriterionError} rather than silently defaulting.
   */
  #resolveVersion(criterion: CriterionElement): string | undefined {
    const type = criterion.type;
    if (!isCriterionExpressionTypeElement(type) || type.version === undefined) {
      return undefined;
    }
    if (isStringElement(type.version)) {
      return toValue(type.version) as string;
    }
    throw new CriterionError('Criterion has an invalid expression type "version"', {
      reason: 'invalid-version',
    });
  }

  /**
   * Enforces that a versioned condition type declares only the one version this
   * runner supports. An omitted version is accepted (it is the spec default);
   * any other declared version throws a {@link CriterionError}.
   */
  #requireVersion(
    criterion: CriterionElement,
    type: string,
    condition: string,
    supported: string,
  ): void {
    const version = this.#resolveVersion(criterion);
    if (version !== undefined && version !== supported) {
      throw new CriterionError(`Unsupported ${type} version "${version}" (only ${supported})`, {
        condition,
        type,
        reason: 'unsupported-version',
      });
    }
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
