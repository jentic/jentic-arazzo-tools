import { evaluate as evaluateJSONPath, JSONPathError } from '@swaggerexpert/jsonpath';

import CriterionError from '../errors/CriterionError.ts';

/**
 * Evaluates a `jsonpath` Arazzo criterion condition against a resolved context value.
 *
 * The condition is a JSONPath query (RFC 9535, per the Criterion Expression
 * Type Object's pinned version) applied to the resolved `context`. The criterion
 * is met when the query yields a non-empty node list.
 *
 * Per Arazzo 1.1.0, a `null` or `undefined` context fails the condition. The
 * context is a plain runtime value (the runtime expression evaluator has already
 * converted any ApiDOM element), so the default JSON evaluation realm applies.
 * @public
 */
class JSONPathCriterionEvaluator {
  /**
   * Runs the JSONPath `condition` against the resolved context value, returning
   * whether it matched anything.
   *
   * Returns `false` when the context is `null` or `undefined`. Throws
   * {@link CriterionError} when the condition is not a valid JSONPath query.
   */
  evaluate(condition: string, context: unknown): boolean {
    if (context === null || context === undefined) return false;

    try {
      return evaluateJSONPath(context, condition).length > 0;
    } catch (error: unknown) {
      if (error instanceof JSONPathError) {
        throw new CriterionError(`Invalid jsonpath criterion condition "${condition}"`, {
          cause: error,
          condition,
          type: 'jsonpath',
          reason: 'invalid-jsonpath',
        });
      }
      throw error;
    }
  }
}

export default JSONPathCriterionEvaluator;
