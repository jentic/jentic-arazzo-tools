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
    { response: { statusCode: 200, body: { status: 'Available', pets: [{ id: 1 }] } } },
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

  context('jsonpath type', function () {
    specify('should evaluate a jsonpath query against the resolved context', function () {
      const criterion = refractCriterion({
        context: '$response.body',
        condition: '$.pets[*]',
        type: 'jsonpath',
      });

      assert.isTrue(evaluator.evaluate(criterion, resolve));
    });

    specify('should not be met when the query matches nothing', function () {
      const criterion = refractCriterion({
        context: '$response.body',
        condition: '$.orders[*]',
        type: 'jsonpath',
      });

      assert.isFalse(evaluator.evaluate(criterion, resolve));
    });

    specify('should accept an explicit rfc9535 version', function () {
      const criterion = refractCriterion({ context: '$response.body', condition: '$.pets[*]' });
      criterion.type = new CriterionExpressionTypeElement({ type: 'jsonpath', version: 'rfc9535' });

      assert.isTrue(evaluator.evaluate(criterion, resolve));
    });

    specify('should throw for a non-rfc9535 jsonpath version', function () {
      const criterion = refractCriterion({ context: '$response.body', condition: '$.pets[*]' });
      criterion.type = new CriterionExpressionTypeElement({
        type: 'jsonpath',
        version: 'draft-goessner-dispatch-jsonpath-00',
      });

      assert.throws(
        () => evaluator.evaluate(criterion, resolve),
        CriterionError,
        /Unsupported jsonpath version/,
      );
    });

    specify(
      'should throw for a present-but-non-string version rather than defaulting',
      function () {
        const criterion = refractCriterion({ context: '$response.body', condition: '$.pets[*]' });
        // a version that is present but not a string is malformed — it must not
        // silently fall back to the default rfc9535.
        criterion.type = new CriterionExpressionTypeElement({ type: 'jsonpath', version: 42 });

        assert.throws(
          () => evaluator.evaluate(criterion, resolve),
          CriterionError,
          /invalid expression type "version"/,
        );
      },
    );
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

    specify('should throw "not yet supported" for an xpath condition', function () {
      const criterion = refractCriterion({
        context: '$response.body',
        condition: '/pets',
        type: 'xpath',
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

    specify(
      'should throw "unknown type" for jsonpointer (a version value, not a type)',
      function () {
        // jsonpointer is an allowed expression-type *version* value, not one of the
        // criterion `type` options (simple/regex/jsonpath/xpath).
        const criterion = refractCriterion({
          context: '$response.body',
          condition: '/pets',
          type: 'jsonpointer',
        });

        assert.throws(
          () => evaluator.evaluate(criterion, resolve),
          CriterionError,
          /Unknown criterion type/,
        );
      },
    );
  });
});
