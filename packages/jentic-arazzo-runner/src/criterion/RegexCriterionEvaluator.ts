import CriterionError from '../errors/CriterionError.ts';

/**
 * Evaluates a `regex` Arazzo criterion condition against a resolved context value.
 *
 * The Arazzo specification does not pin a regular expression dialect for the
 * `regex` criterion type. This evaluator uses ECMA-262 (the native `RegExp`
 * dialect), matching OpenAPI, which pins ECMA-262 for `pattern` via JSON Schema.
 * The pattern is applied with search (not full-match) semantics — anchoring is
 * the author's responsibility via `^`/`$`, consistent with the spec's `^200$`
 * example.
 *
 * Per Arazzo 1.1.0, a `null` or `undefined` context fails the condition.
 *
 * The context is coerced with `String()`, so a non-scalar context matches
 * against its coercion (an object becomes `"[object Object]"`, an array its
 * comma-joined items); the spec does not define regex over non-scalar contexts,
 * so authors should target a scalar via the `context` runtime expression.
 *
 * The pattern is a native `RegExp`, which has no execution timeout; a
 * pathological author pattern (catastrophic backtracking) against a long
 * context can stall. Patterns originate from the Arazzo document, so this is
 * treated as trusted input rather than guarded here.
 * @public
 */
class RegexCriterionEvaluator {
  /**
   * Tests the resolved context value against the regular expression `condition`.
   *
   * The context is coerced to a string before matching. Returns `false` when the
   * context is `null` or `undefined`. Throws {@link CriterionError} when the
   * condition is not a valid regular expression.
   */
  evaluate(condition: string, context: unknown): boolean {
    if (context === null || context === undefined) return false;

    let regExp: RegExp;
    try {
      regExp = new RegExp(condition);
    } catch (error: unknown) {
      throw new CriterionError(`Invalid regex criterion condition "${condition}"`, {
        cause: error,
        condition,
        type: 'regex',
        reason: 'invalid-regex',
      });
    }

    return regExp.test(String(context));
  }
}

export default RegexCriterionEvaluator;
