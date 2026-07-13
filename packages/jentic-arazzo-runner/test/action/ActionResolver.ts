import { assert } from 'chai';
import {
  StepOnSuccessElement,
  StepOnFailureElement,
  refractSuccessAction,
  refractFailureAction,
  isCriterionElement,
  isSuccessActionElement,
  isFailureActionElement,
  type CriterionElement,
} from '@speclynx/apidom-ns-arazzo-1';
import { toValue } from '@speclynx/apidom-core';

import { ActionResolver, type CriterionPredicate, type SelectedAction } from '../../src/index.ts';

describe('ActionResolver', function () {
  let resolver: ActionResolver;

  beforeEach(function () {
    resolver = new ActionResolver();
  });

  // a predicate that treats a criterion whose condition is 'pass' as met.
  const byCondition: CriterionPredicate = (criterion: CriterionElement) =>
    isCriterionElement(criterion) && toValue(criterion.condition) === 'pass';
  const always: CriterionPredicate = () => true;

  const onSuccess = (...actions: unknown[]): StepOnSuccessElement =>
    new StepOnSuccessElement(actions.map((a) => refractSuccessAction(a)));
  const onFailure = (...actions: unknown[]): StepOnFailureElement =>
    new StepOnFailureElement(actions.map((a) => refractFailureAction(a)));

  context('selection', function () {
    specify('should select the first action whose criteria all pass', function () {
      const actions = onSuccess(
        { name: 'a', type: 'goto', stepId: 'first', criteria: [{ condition: 'fail' }] },
        { name: 'b', type: 'goto', stepId: 'second', criteria: [{ condition: 'pass' }] },
        { name: 'c', type: 'goto', stepId: 'third', criteria: [{ condition: 'pass' }] },
      );

      const selected = resolver.resolve(actions, byCondition);
      assert.isTrue(isSuccessActionElement(selected));
      assert.strictEqual(toValue(selected?.stepId), 'second');
    });

    specify('should require all of an action criteria to pass', function () {
      const actions = onSuccess({
        name: 'a',
        type: 'end',
        criteria: [{ condition: 'pass' }, { condition: 'fail' }],
      });

      assert.isUndefined(resolver.resolve(actions, byCondition));
    });

    specify('should treat an action with no criteria as always matching', function () {
      const selected = resolver.resolve(onSuccess({ name: 'a', type: 'end' }), byCondition);

      assert.strictEqual(toValue(selected?.type), 'end');
    });

    specify('should treat an action with an empty criteria list as matching', function () {
      const selected = resolver.resolve(
        onSuccess({ name: 'a', type: 'end', criteria: [] }),
        byCondition,
      );

      assert.strictEqual(toValue(selected?.type), 'end');
    });

    specify('should return undefined when no action matches', function () {
      const actions = onSuccess({ name: 'a', type: 'end', criteria: [{ condition: 'fail' }] });

      assert.isUndefined(resolver.resolve(actions, byCondition));
    });

    specify('should return undefined when the action list is absent', function () {
      assert.isUndefined(resolver.resolve(undefined, always));
    });
  });

  context('selected action element', function () {
    const select = (action: unknown, predicate = always): SelectedAction | undefined =>
      resolver.resolve(onFailure(action), predicate);

    specify('should return the goto action element with its target', function () {
      const selected = resolver.resolve(
        onSuccess({ name: 'a', type: 'goto', stepId: 'next' }),
        always,
      );

      assert.strictEqual(toValue(selected?.type), 'goto');
      assert.strictEqual(toValue(selected?.stepId), 'next');
    });

    specify('should return the retry action element with its bounds', function () {
      const selected = select({ name: 'a', type: 'retry', retryAfter: 3, retryLimit: 5 });

      assert.isTrue(isFailureActionElement(selected));
      assert.strictEqual(toValue(selected?.type), 'retry');
      assert.strictEqual(toValue((selected as { retryAfter?: unknown }).retryAfter), 3);
      assert.strictEqual(toValue((selected as { retryLimit?: unknown }).retryLimit), 5);
    });

    specify('should return the workflow-transfer action element', function () {
      const selected = select({ name: 'a', type: 'goto', workflowId: 'wf' });

      assert.strictEqual(toValue(selected?.workflowId), 'wf');
    });
  });
});
