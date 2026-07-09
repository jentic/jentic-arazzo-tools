import { assert } from 'chai';
import { StepOutputsElement } from '@speclynx/apidom-ns-arazzo-1';

import {
  OutputResolver,
  RuntimeExpressionEvaluator,
  type OutputValueResolver,
} from '../../src/index.ts';

describe('OutputResolver', function () {
  const runtime = new RuntimeExpressionEvaluator(
    {
      response: { statusCode: 200, body: { token: 'abc', user: { id: 42 } } },
      steps: { login: { outputs: { session: 's-1' } } },
    },
    { strict: false },
  );
  const resolve: OutputValueResolver = (expression) => runtime.evaluate(expression);
  let resolver: OutputResolver;

  beforeEach(function () {
    resolver = new OutputResolver();
  });

  context('resolve', function () {
    specify('should resolve each output expression to its typed value', function () {
      const outputs = new StepOutputsElement({
        token: '$response.body#/token',
        userId: '$response.body#/user/id',
      });

      assert.deepEqual(resolver.resolve(outputs, resolve), { token: 'abc', userId: 42 });
    });

    specify('should resolve an output referencing a prior step', function () {
      const outputs = new StepOutputsElement({ session: '$steps.login.outputs.session' });

      assert.deepEqual(resolver.resolve(outputs, resolve), { session: 's-1' });
    });

    specify('should return an empty object when outputs are absent', function () {
      assert.deepEqual(resolver.resolve(undefined, resolve), {});
    });

    specify('should resolve an unresolvable output to undefined (lenient)', function () {
      const outputs = new StepOutputsElement({ missing: '$response.body#/nope' });

      assert.deepEqual(resolver.resolve(outputs, resolve), { missing: undefined });
    });

    specify(
      'should not interpolate a non-expression string (no embedded expressions in 1.0.1)',
      function () {
        const outputs = new StepOutputsElement({ raw: '{$response.body#/token}' });

        assert.deepEqual(resolver.resolve(outputs, resolve), { raw: '{$response.body#/token}' });
      },
    );
  });
});
