import { assert } from 'chai';
import { refractCriterion, CriterionExpressionTypeElement } from '@speclynx/apidom-ns-arazzo-1';

import {
  CriterionEvaluator,
  CriterionError,
  RuntimeExpressionEvaluator,
  type CriterionContextResolver,
} from '../../src/index.ts';

describe('CriterionEvaluator', function () {
  // the resolver bridges a criterion's `context` to the runtime expression
  // evaluator, leniently so an unresolvable context fails the criterion.
  const runtime = new RuntimeExpressionEvaluator(
    { response: { statusCode: 200, body: { status: 'Available' } } },
    { strict: false },
  );
  const resolve: CriterionContextResolver = (expression) => runtime.evaluate(expression);
  const evaluator = new CriterionEvaluator();

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

      assert.isTrue(evaluator.evaluate(criterion, resolve));
    });

    specify('should evaluate to false when the pattern does not match', function () {
      const criterion = refractCriterion({
        context: '$statusCode',
        condition: '^404$',
        type: 'regex',
      });

      assert.isFalse(evaluator.evaluate(criterion, resolve));
    });

    specify('should match against a resolved response body value', function () {
      const criterion = refractCriterion({
        context: '$response.body#/status',
        condition: 'Available',
        type: 'regex',
      });

      assert.isTrue(evaluator.evaluate(criterion, resolve));
    });

    specify('should fail when the context runtime expression is unresolvable', function () {
      const criterion = refractCriterion({
        context: '$response.body#/missing',
        condition: '^.*$',
        type: 'regex',
      });

      assert.isFalse(evaluator.evaluate(criterion, resolve));
    });

    specify('should read the type from a Criterion Expression Type Object', function () {
      const criterion = refractCriterion({ context: '$statusCode', condition: '^200$' });
      criterion.type = new CriterionExpressionTypeElement({ type: 'regex' });

      assert.isTrue(evaluator.evaluate(criterion, resolve));
    });

    specify('should throw when a regex criterion has no context', function () {
      const criterion = refractCriterion({ condition: '^200$', type: 'regex' });

      assert.throws(() => evaluator.evaluate(criterion, resolve), CriterionError);
    });
  });

  context('simple type (default)', function () {
    specify('should evaluate a simple condition when type is omitted', function () {
      const criterion = refractCriterion({ condition: '$statusCode == 200' });

      assert.isTrue(evaluator.evaluate(criterion, resolve));
    });

    specify('should evaluate a false simple condition', function () {
      const criterion = refractCriterion({ condition: '$statusCode == 404' });

      assert.isFalse(evaluator.evaluate(criterion, resolve));
    });

    specify('should not require a context for a simple condition', function () {
      // simple embeds its expressions in the condition — no separate context.
      const criterion = refractCriterion({
        condition: "$response.body.status == 'available'",
      });

      assert.isTrue(evaluator.evaluate(criterion, resolve));
    });
  });

  context('condition and type validation', function () {
    specify('should throw when the condition is missing', function () {
      const criterion = refractCriterion({ context: '$statusCode', type: 'regex' });

      assert.throws(() => evaluator.evaluate(criterion, resolve), CriterionError);
    });

    specify('should throw when the condition is an empty string', function () {
      const criterion = refractCriterion({ context: '$statusCode', condition: '', type: 'regex' });

      assert.throws(() => evaluator.evaluate(criterion, resolve), CriterionError, /missing/);
    });

    specify('should throw "not yet supported" for a jsonpath condition', function () {
      const criterion = refractCriterion({
        context: '$response.body',
        condition: '$[?count(@.pets) > 0]',
        type: 'jsonpath',
      });

      assert.throws(
        () => evaluator.evaluate(criterion, resolve),
        CriterionError,
        /not yet supported/,
      );
    });

    specify('should throw for a present-but-malformed type rather than defaulting', function () {
      const criterion = refractCriterion({ context: '$statusCode', condition: '^200$' });
      // a Criterion Expression Type Object with no inner `type` is present but
      // unreadable — it must not silently degrade to `simple`.
      criterion.type = new CriterionExpressionTypeElement();

      assert.throws(() => evaluator.evaluate(criterion, resolve), CriterionError, /invalid "type"/);
    });
  });
});
