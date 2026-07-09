import { assert } from 'chai';
import { refractRequestBody } from '@speclynx/apidom-ns-arazzo-1';

import {
  RequestBodyResolver,
  RuntimeExpressionEvaluator,
  ResolverError,
  type RequestBodyValueResolver,
} from '../../src/index.ts';

describe('RequestBodyResolver', function () {
  const runtime = new RuntimeExpressionEvaluator(
    { inputs: { petId: 7, order: { item: 'x', qty: 1 } } },
    { strict: false },
  );
  const resolve: RequestBodyValueResolver = (expression) => runtime.evaluate(expression);
  let resolver: RequestBodyResolver;

  beforeEach(function () {
    resolver = new RequestBodyResolver();
  });

  context('resolve', function () {
    specify('should return undefined when there is no request body', function () {
      assert.isUndefined(resolver.resolve(undefined, resolve));
    });

    specify('should resolve a whole-expression payload to its typed value', function () {
      const requestBody = refractRequestBody({ payload: '$inputs.order' });

      assert.deepEqual(resolver.resolve(requestBody, resolve), {
        payload: { item: 'x', qty: 1 },
      });
    });

    specify('should use a literal object payload as-is', function () {
      const requestBody = refractRequestBody({ payload: { a: 1, b: 'two' } });

      assert.deepEqual(resolver.resolve(requestBody, resolve), { payload: { a: 1, b: 'two' } });
    });

    specify('should include the declared content type', function () {
      const requestBody = refractRequestBody({
        contentType: 'application/json',
        payload: { a: 1 },
      });

      assert.deepEqual(resolver.resolve(requestBody, resolve), {
        payload: { a: 1 },
        contentType: 'application/json',
      });
    });

    specify('should apply a replacement at a JSON Pointer target', function () {
      const requestBody = refractRequestBody({
        payload: { petId: 0, qty: 1 },
        replacements: [
          { target: '/petId', value: '$inputs.petId' },
          { target: '/qty', value: 10 },
        ],
      });

      assert.deepEqual(resolver.resolve(requestBody, resolve), {
        payload: { petId: 7, qty: 10 },
      });
    });

    specify('should apply a replacement at a nested JSON Pointer target', function () {
      const requestBody = refractRequestBody({
        payload: { order: { item: 'old' } },
        replacements: [{ target: '/order/item', value: '$inputs.order' }],
      });

      const result = resolver.resolve(requestBody, resolve) as {
        payload: { order: { item: unknown } };
      };
      assert.deepEqual(result.payload.order.item, { item: 'x', qty: 1 });
    });

    specify('should replace the whole payload for an empty pointer target', function () {
      const requestBody = refractRequestBody({
        payload: { ignored: true },
        replacements: [{ target: '', value: '$inputs.order' }],
      });

      assert.deepEqual(resolver.resolve(requestBody, resolve), {
        payload: { item: 'x', qty: 1 },
      });
    });

    specify('should throw ResolverError for a non-JSON-Pointer (XPath) target', function () {
      // a JSON Pointer must start with `/`; a bare path like `a/b` (or an XPath)
      // is not a valid pointer and is treated as an unsupported target.
      const requestBody = refractRequestBody({
        payload: { a: 1 },
        replacements: [{ target: 'a/b', value: 1 }],
      });

      assert.throws(() => resolver.resolve(requestBody, resolve), ResolverError, /JSON Pointer/);
    });

    specify(
      'should throw ResolverError when the target does not resolve in the payload',
      function () {
        const requestBody = refractRequestBody({
          payload: { a: 1 },
          replacements: [{ target: '/missing/deep', value: 1 }],
        });

        assert.throws(
          () => resolver.resolve(requestBody, resolve),
          ResolverError,
          /does not resolve/,
        );
      },
    );

    specify('should not mutate a payload aliased from a runtime expression', function () {
      // when the payload is `$inputs.order`, the evaluator returns the live
      // context object by reference; applying a replacement must not corrupt it.
      const inputs = { order: { item: 'x', qty: 1 } };
      const isolated = new RuntimeExpressionEvaluator({ inputs }, { strict: false });
      const isolatedResolve: RequestBodyValueResolver = (expression) =>
        isolated.evaluate(expression);
      const requestBody = refractRequestBody({
        payload: '$inputs.order',
        replacements: [{ target: '/qty', value: 999 }],
      });

      const result = resolver.resolve(requestBody, isolatedResolve) as { payload: { qty: number } };

      assert.strictEqual(result.payload.qty, 999);
      assert.strictEqual(inputs.order.qty, 1, 'the source $inputs.order must be untouched');
    });

    specify('should reject a prototype-polluting target', function () {
      const requestBody = refractRequestBody({
        payload: { a: 1 },
        replacements: [{ target: '/__proto__/polluted', value: 'yes' }],
      });

      assert.throws(
        () => resolver.resolve(requestBody, resolve),
        ResolverError,
        /does not resolve/,
      );
      assert.isUndefined(({} as Record<string, unknown>).polluted);
    });
  });
});
