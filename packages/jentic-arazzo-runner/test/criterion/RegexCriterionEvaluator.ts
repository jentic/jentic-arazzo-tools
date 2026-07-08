import { assert } from 'chai';

import { RegexCriterionEvaluator, CriterionError } from '../../src/index.ts';

describe('RegexCriterionEvaluator', function () {
  let evaluator: RegexCriterionEvaluator;

  beforeEach(function () {
    evaluator = new RegexCriterionEvaluator();
  });

  context('evaluate', function () {
    specify('should match an anchored pattern against a stringified number', function () {
      assert.isTrue(evaluator.evaluate('^200$', 200));
    });

    specify('should fail when an anchored pattern does not match', function () {
      assert.isFalse(evaluator.evaluate('^200$', 404));
    });

    specify('should match a 2xx range pattern', function () {
      assert.isTrue(evaluator.evaluate('^2\\d{2}$', 201));
      assert.isFalse(evaluator.evaluate('^2\\d{2}$', 302));
    });

    specify(
      'should apply search (not full-match) semantics for an unanchored pattern',
      function () {
        assert.isTrue(evaluator.evaluate('available', 'currently available now'));
      },
    );

    specify('should be case-sensitive by default', function () {
      assert.isFalse(evaluator.evaluate('available', 'AVAILABLE'));
    });

    specify('should coerce a string context', function () {
      assert.isTrue(evaluator.evaluate('^ok$', 'ok'));
    });

    specify('should fail on a null context (Arazzo 1.1.0)', function () {
      assert.isFalse(evaluator.evaluate('^.*$', null));
    });

    specify('should fail on an undefined context (Arazzo 1.1.0)', function () {
      assert.isFalse(evaluator.evaluate('^.*$', undefined));
    });

    specify('should throw CriterionError for an invalid regular expression', function () {
      assert.throws(() => evaluator.evaluate('(', 'x'), CriterionError);
    });
  });
});
