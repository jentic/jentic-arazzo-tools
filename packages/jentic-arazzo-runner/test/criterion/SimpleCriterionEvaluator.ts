import { assert } from 'chai';

import {
  SimpleCriterionEvaluator,
  CriterionError,
  RuntimeExpressionEvaluator,
  type CriterionContextResolver,
} from '../../src/index.ts';

describe('SimpleCriterionEvaluator', function () {
  const runtime = new RuntimeExpressionEvaluator(
    {
      response: { statusCode: 200, body: { status: 'Available', data: [{ id: 42 }] } },
      inputs: { limit: 10 },
    },
    { strict: false },
  );
  const resolve: CriterionContextResolver = (expression) => runtime.evaluate(expression);
  let evaluator: SimpleCriterionEvaluator;

  beforeEach(function () {
    evaluator = new SimpleCriterionEvaluator();
  });

  context('evaluate', function () {
    specify('should evaluate an equality comparison', function () {
      assert.isTrue(evaluator.evaluate('$statusCode == 200', resolve));
      assert.isFalse(evaluator.evaluate('$statusCode == 404', resolve));
    });

    specify('should compare strings case-insensitively', function () {
      assert.isTrue(evaluator.evaluate("$response.body.status == 'available'", resolve));
    });

    specify('should evaluate relational operators', function () {
      assert.isTrue(evaluator.evaluate('$statusCode >= 200 && $statusCode < 300', resolve));
    });

    specify('should navigate member and index access', function () {
      assert.isTrue(evaluator.evaluate('$response.body.data[0].id > 10', resolve));
    });

    specify('should evaluate logical conjunction of expressions', function () {
      assert.isTrue(
        evaluator.evaluate("$statusCode == 200 && $response.body.status == 'available'", resolve),
      );
      assert.isFalse(
        evaluator.evaluate("$statusCode == 200 && $response.body.status == 'sold'", resolve),
      );
    });

    specify('should fail rather than throw when an operand is unresolvable', function () {
      const lenient: CriterionContextResolver = () => undefined;
      assert.isFalse(evaluator.evaluate('$statusCode == 200', lenient));
    });

    specify('should throw CriterionError for a malformed condition', function () {
      assert.throws(() => evaluator.evaluate('$statusCode ===', resolve), CriterionError);
    });
  });
});
