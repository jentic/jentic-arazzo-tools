import { assert } from 'chai';
import { refractCriterion, CriterionExpressionTypeElement } from '@speclynx/apidom-ns-arazzo-1';

import { CriterionEvaluator, CriterionError } from '../../src/index.ts';
import type { RuntimeExpressionContext } from '../../src/index.ts';

describe('CriterionEvaluator', function () {
  const runtimeContext: RuntimeExpressionContext = {
    response: { statusCode: 200, body: { status: 'Available' } },
  };

  context('regex type', function () {
    specify('should evaluate the spec $statusCode regex example to true', function () {
      // - context: $statusCode
      //   condition: '^200$'
      //   type: regex
      const criterion = refractCriterion({
        context: '$statusCode',
        condition: '^200$',
        type: 'regex',
      });
      const evaluator = new CriterionEvaluator({ context: runtimeContext });

      assert.isTrue(evaluator.evaluate(criterion));
    });

    specify('should evaluate to false when the pattern does not match', function () {
      const criterion = refractCriterion({
        context: '$statusCode',
        condition: '^404$',
        type: 'regex',
      });
      const evaluator = new CriterionEvaluator({ context: runtimeContext });

      assert.isFalse(evaluator.evaluate(criterion));
    });

    specify('should match against a resolved response body value', function () {
      const criterion = refractCriterion({
        context: '$response.body#/status',
        condition: 'Available',
        type: 'regex',
      });
      const evaluator = new CriterionEvaluator({ context: runtimeContext });

      assert.isTrue(evaluator.evaluate(criterion));
    });

    specify('should fail when the context runtime expression is unresolvable', function () {
      const criterion = refractCriterion({
        context: '$response.body#/missing',
        condition: '^.*$',
        type: 'regex',
      });
      const evaluator = new CriterionEvaluator({ context: runtimeContext });

      assert.isFalse(evaluator.evaluate(criterion));
    });

    specify('should read the type from a Criterion Expression Type Object', function () {
      const criterion = refractCriterion({ context: '$statusCode', condition: '^200$' });
      criterion.type = new CriterionExpressionTypeElement({ type: 'regex' });
      const evaluator = new CriterionEvaluator({ context: runtimeContext });

      assert.isTrue(evaluator.evaluate(criterion));
    });

    specify('should throw when a regex criterion has no context', function () {
      const criterion = refractCriterion({ condition: '^200$', type: 'regex' });
      const evaluator = new CriterionEvaluator({ context: runtimeContext });

      assert.throws(() => evaluator.evaluate(criterion), CriterionError);
    });
  });

  context('condition and type validation', function () {
    specify('should throw when the condition is missing', function () {
      const criterion = refractCriterion({ context: '$statusCode', type: 'regex' });
      const evaluator = new CriterionEvaluator({ context: runtimeContext });

      assert.throws(() => evaluator.evaluate(criterion), CriterionError);
    });

    specify('should throw "not yet supported" for a simple condition', function () {
      const criterion = refractCriterion({ condition: '$statusCode == 200' });
      const evaluator = new CriterionEvaluator({ context: runtimeContext });

      assert.throws(() => evaluator.evaluate(criterion), CriterionError, /not yet supported/);
    });

    specify('should throw "not yet supported" for a jsonpath condition', function () {
      const criterion = refractCriterion({
        context: '$response.body',
        condition: '$[?count(@.pets) > 0]',
        type: 'jsonpath',
      });
      const evaluator = new CriterionEvaluator({ context: runtimeContext });

      assert.throws(() => evaluator.evaluate(criterion), CriterionError, /not yet supported/);
    });
  });
});
