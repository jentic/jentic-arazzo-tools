import {
  evaluate as evaluateSimpleCriterion,
  ArazzoCriterionError,
} from '@swaggerexpert/arazzo-criterion';

import CriterionError from '../errors/CriterionError.ts';
import type { CriterionContextResolver } from './CriterionEvaluator.ts';

/**
 * Evaluates a `simple` Arazzo criterion condition.
 *
 * A simple condition embeds runtime expressions directly in the condition
 * (e.g. `$statusCode == 200 && $response.body.status == 'available'`), so —
 * unlike `regex`/`jsonpath`/`xpath` — it has no separate `context`. Parsing,
 * loose/case-insensitive comparison, and member/index navigation are delegated
 * to `@swaggerexpert/arazzo-criterion`; each embedded runtime expression is
 * resolved through the supplied resolver.
 *
 * An operand that resolves to `undefined` (a lenient miss) fails the comparison
 * rather than throwing, so an unsatisfiable criterion is simply not met. A
 * malformed condition throws {@link CriterionError}.
 * @public
 */
class SimpleCriterionEvaluator {
  /**
   * Evaluates the simple `condition`, resolving each embedded runtime
   * expression via `resolve`.
   */
  evaluate(condition: string, resolve: CriterionContextResolver): boolean {
    try {
      return evaluateSimpleCriterion(condition, { resolve });
    } catch (error: unknown) {
      if (error instanceof ArazzoCriterionError) {
        throw new CriterionError(`Invalid simple criterion condition "${condition}"`, {
          cause: error,
          condition,
          type: 'simple',
          reason: 'invalid-simple',
        });
      }
      throw error;
    }
  }
}

export default SimpleCriterionEvaluator;
