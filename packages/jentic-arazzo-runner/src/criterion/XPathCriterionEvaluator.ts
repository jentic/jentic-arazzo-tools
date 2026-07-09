// fontoxpath is CommonJS and its named exports are not statically resolvable
// under ESM, so import the default and destructure.
import fontoxpath from 'fontoxpath';
import { DOMParser } from '@xmldom/xmldom';

import CriterionError from '../errors/CriterionError.ts';

const { evaluateXPathToBoolean, evaluateXPath } = fontoxpath;

/**
 * Evaluates an `xpath` Arazzo criterion condition against a resolved context value.
 *
 * The condition is an XPath 3.1 query applied to the resolved `context`, which
 * must be XML. A string context is parsed as XML; an already-parsed DOM node is
 * used as-is. The criterion is met by the query's Effective Boolean Value
 * (XPath 3.1 §19.1.2), as the Arazzo specification mandates — so a boolean
 * predicate (`//status = 'ok'`), a non-empty node set, a non-zero number, and a
 * non-empty string all evaluate to `true`.
 *
 * Only XPath 3.1 is supported (`fontoxpath`'s engine); version gating happens in
 * the facade. Per Arazzo 1.1.0, a `null` or `undefined` context fails the
 * condition. An invalid query throws {@link CriterionError}.
 * @public
 */
class XPathCriterionEvaluator {
  /**
   * Evaluates the XPath `condition` against the resolved context value, returning
   * its Effective Boolean Value.
   *
   * Returns `false` when the context is `null` or `undefined`. Throws
   * {@link CriterionError} when the context is not XML or the query is invalid.
   */
  evaluate(condition: string, context: unknown): boolean {
    if (context === null || context === undefined) return false;

    const node = this.#toNode(condition, context);

    try {
      return evaluateXPathToBoolean(condition, node, null, null, {
        language: evaluateXPath.XPATH_3_1_LANGUAGE,
      });
    } catch (error: unknown) {
      throw new CriterionError(`Invalid xpath criterion condition "${condition}"`, {
        cause: error,
        condition,
        type: 'xpath',
        reason: 'invalid-xpath',
      });
    }
  }

  /**
   * Coerces the resolved context to an XML DOM node: an already-parsed node is
   * used as-is, a string is parsed as XML. Any other value cannot be an XPath
   * context and throws.
   */
  #toNode(condition: string, context: unknown): unknown {
    if (this.#isNode(context)) return context;

    if (typeof context !== 'string') {
      throw new CriterionError('xpath criterion context is not XML', {
        condition,
        type: 'xpath',
        reason: 'invalid-context',
      });
    }

    try {
      return new DOMParser().parseFromString(context, 'text/xml');
    } catch (error: unknown) {
      throw new CriterionError('xpath criterion context is not valid XML', {
        cause: error,
        condition,
        type: 'xpath',
        reason: 'invalid-context',
      });
    }
  }

  /**
   * Duck-types a DOM node (has a numeric `nodeType`), so a caller may pass an
   * already-parsed document instead of an XML string.
   */
  #isNode(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as { nodeType?: unknown }).nodeType === 'number'
    );
  }
}

export default XPathCriterionEvaluator;
