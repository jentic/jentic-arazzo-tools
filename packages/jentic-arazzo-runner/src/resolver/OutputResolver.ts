import { toValue } from '@speclynx/apidom-core';
import { test as isRuntimeExpression } from '@swaggerexpert/arazzo-runtime-expression';
import type { StepOutputsElement, WorkflowOutputsElement } from '@speclynx/apidom-ns-arazzo-1';

/**
 * Resolves a runtime expression to its value.
 *
 * Bridged to a lenient runtime expression evaluator
 * (`(expression) => runtimeExpressionEvaluator.evaluate(expression)`), so an
 * unresolvable reference yields `undefined` rather than throwing.
 * @public
 */
export type OutputValueResolver = (expression: string) => unknown;

/**
 * Resolves a step's or workflow's `outputs` to a plain map of name → value.
 *
 * Per Arazzo 1.0.1 an output value is a whole runtime expression (the spec types
 * `outputs` as `Map[string, {expression}]`) — there is no embedded/interpolated
 * expression. So a string value is resolved as an expression when the entire
 * string is a valid runtime expression; any other value is used as-is. This is
 * the same value rule as the parameter and request body resolvers, and
 * deliberately not template interpolation.
 *
 * The result is the map an executor stores into the workflow execution state so
 * later steps can read `$steps.{id}.outputs.{name}` / `$outputs.{name}`.
 * @public
 */
class OutputResolver {
  /**
   * Resolves each output value, returning a `name` → value map. Returns an empty
   * object when there are no outputs.
   */
  resolve(
    outputs: StepOutputsElement | WorkflowOutputsElement | undefined,
    resolve: OutputValueResolver,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    if (outputs === undefined) return result;

    outputs.forEach((value, key) => {
      const name = toValue(key) as string;
      const resolved = toValue(value);
      result[name] =
        typeof resolved === 'string' && isRuntimeExpression(resolved)
          ? resolve(resolved)
          : resolved;
    });

    return result;
  }
}

export default OutputResolver;
