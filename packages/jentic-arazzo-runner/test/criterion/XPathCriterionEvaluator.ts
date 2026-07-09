import { assert } from 'chai';

import { XPathCriterionEvaluator, CriterionError } from '../../src/index.ts';

describe('XPathCriterionEvaluator', function () {
  let evaluator: XPathCriterionEvaluator;

  const xml =
    '<order><status>available</status><items><item id="1"/><item id="2"/></items></order>';

  beforeEach(function () {
    evaluator = new XPathCriterionEvaluator();
  });

  context('evaluate', function () {
    specify('should be met for a true boolean predicate (Effective Boolean Value)', function () {
      assert.isTrue(evaluator.evaluate("//status = 'available'", xml));
    });

    specify('should not be met for a false boolean predicate', function () {
      assert.isFalse(evaluator.evaluate("//status = 'sold'", xml));
    });

    specify('should be met for a non-empty node selection', function () {
      assert.isTrue(evaluator.evaluate('//item', xml));
    });

    specify('should not be met for an empty node selection', function () {
      assert.isFalse(evaluator.evaluate('//missing', xml));
    });

    specify('should evaluate an XPath 3.1 function', function () {
      assert.isTrue(evaluator.evaluate("string-join(//item/@id, ',') = '1,2'", xml));
    });

    specify('should fail on a null context (Arazzo 1.1.0)', function () {
      assert.isFalse(evaluator.evaluate('//status', null));
    });

    specify('should fail on an undefined context (Arazzo 1.1.0)', function () {
      assert.isFalse(evaluator.evaluate('//status', undefined));
    });

    specify('should throw CriterionError for an invalid XPath query', function () {
      assert.throws(() => evaluator.evaluate('//[', xml), CriterionError);
    });

    specify('should throw CriterionError for a non-XML (object) context', function () {
      assert.throws(() => evaluator.evaluate('//status', { status: 'available' }), CriterionError);
    });
  });
});
