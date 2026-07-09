import { assert } from 'chai';

import { JSONPathCriterionEvaluator, CriterionError } from '../../src/index.ts';

describe('JSONPathCriterionEvaluator', function () {
  let evaluator: JSONPathCriterionEvaluator;

  beforeEach(function () {
    evaluator = new JSONPathCriterionEvaluator();
  });

  context('evaluate', function () {
    specify('should be met when the query matches a node', function () {
      assert.isTrue(evaluator.evaluate('$.pets[*]', { pets: [{ id: 1 }, { id: 2 }] }));
    });

    specify('should not be met when the query matches nothing', function () {
      assert.isFalse(evaluator.evaluate('$.pets[*]', { pets: [] }));
    });

    specify('should evaluate a filter query', function () {
      assert.isTrue(evaluator.evaluate('$.pets[?@.id == 1]', { pets: [{ id: 1 }] }));
      assert.isFalse(evaluator.evaluate('$.pets[?@.id == 9]', { pets: [{ id: 1 }] }));
    });

    specify('should query against an array context', function () {
      assert.isTrue(evaluator.evaluate('$[?@.id > 1]', [{ id: 1 }, { id: 2 }]));
    });

    specify('should fail on a null context (Arazzo 1.1.0)', function () {
      assert.isFalse(evaluator.evaluate('$', null));
    });

    specify('should fail on an undefined context (Arazzo 1.1.0)', function () {
      assert.isFalse(evaluator.evaluate('$', undefined));
    });

    specify('should throw CriterionError for an invalid JSONPath query', function () {
      assert.throws(() => evaluator.evaluate('$[[[', { a: 1 }), CriterionError);
    });
  });
});
