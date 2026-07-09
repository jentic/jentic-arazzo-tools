import { assert } from 'chai';
import { StepParametersElement, refractParameter } from '@speclynx/apidom-ns-arazzo-1';

import {
  ParameterResolver,
  RuntimeExpressionEvaluator,
  type ParameterValueResolver,
} from '../../src/index.ts';

describe('ParameterResolver', function () {
  const runtime = new RuntimeExpressionEvaluator(
    { inputs: { status: 'available', limit: 10 }, steps: { login: { outputs: { token: 'abc' } } } },
    { strict: false },
  );
  const resolve: ParameterValueResolver = (expression) => runtime.evaluate(expression);
  let resolver: ParameterResolver;

  beforeEach(function () {
    resolver = new ParameterResolver();
  });

  const parameters = (...entries: { name: string; value: unknown }[]): StepParametersElement =>
    new StepParametersElement(entries.map((entry) => refractParameter(entry)));

  context('resolve', function () {
    specify('should resolve a whole runtime expression to its typed value', function () {
      const result = resolver.resolve(
        parameters({ name: 'status', value: '$inputs.status' }),
        resolve,
      );

      assert.deepEqual(result, { status: 'available' });
    });

    specify('should preserve the referenced type', function () {
      const result = resolver.resolve(
        parameters({ name: 'limit', value: '$inputs.limit' }),
        resolve,
      );

      assert.strictEqual(result.limit, 10);
    });

    specify('should resolve a step output expression', function () {
      const result = resolver.resolve(
        parameters({ name: 'token', value: '$steps.login.outputs.token' }),
        resolve,
      );

      assert.deepEqual(result, { token: 'abc' });
    });

    specify('should use a literal string as-is', function () {
      const result = resolver.resolve(parameters({ name: 'q', value: 'available' }), resolve);

      assert.deepEqual(result, { q: 'available' });
    });

    specify('should use a literal number/boolean as-is', function () {
      const result = resolver.resolve(
        parameters({ name: 'n', value: 42 }, { name: 'b', value: true }),
        resolve,
      );

      assert.deepEqual(result, { n: 42, b: true });
    });

    specify(
      'should not interpolate a non-expression string (no embedded expressions in 1.0.1)',
      function () {
        // `{$inputs.x}` is a literal string in 1.0.1, not an embedded expression.
        const result = resolver.resolve(parameters({ name: 'raw', value: '{$inputs.x}' }), resolve);

        assert.deepEqual(result, { raw: '{$inputs.x}' });
      },
    );

    specify('should use a literal object value as-is', function () {
      const result = resolver.resolve(
        parameters({ name: 'obj', value: { a: 1, b: '$inputs.status' } }),
        resolve,
      );

      // the object is a literal; its string members are not resolved in 1.0.1.
      assert.deepEqual(result, { obj: { a: 1, b: '$inputs.status' } });
    });

    specify('should resolve multiple parameters keyed by name', function () {
      const result = resolver.resolve(
        parameters(
          { name: 'status', value: '$inputs.status' },
          { name: 'limit', value: '$inputs.limit' },
          { name: 'page', value: 1 },
        ),
        resolve,
      );

      assert.deepEqual(result, { status: 'available', limit: 10, page: 1 });
    });

    specify('should return an empty object when parameters are absent', function () {
      assert.deepEqual(resolver.resolve(undefined, resolve), {});
    });

    specify(
      'should return undefined for an unresolvable expression (lenient resolver)',
      function () {
        const result = resolver.resolve(
          parameters({ name: 'x', value: '$inputs.missing' }),
          resolve,
        );

        assert.deepEqual(result, { x: undefined });
      },
    );
  });
});
