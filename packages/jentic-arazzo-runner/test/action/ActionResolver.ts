import { assert } from 'chai';
import {
  StepOnSuccessElement,
  StepOnFailureElement,
  refractSuccessAction,
  refractFailureAction,
  isCriterionElement,
  type CriterionElement,
} from '@speclynx/apidom-ns-arazzo-1';
import { toValue } from '@speclynx/apidom-core';

import { ActionResolver, type CriterionPredicate } from '../../src/index.ts';

describe('ActionResolver', function () {
  let resolver: ActionResolver;

  beforeEach(function () {
    resolver = new ActionResolver();
  });

  // a predicate that treats a criterion whose condition is the string 'pass' as
  // met and anything else as not met — enough to drive selection.
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

      assert.deepEqual(resolver.resolve(actions, byCondition), {
        type: 'goto',
        workflowId: undefined,
        stepId: 'second',
      });
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
      const actions = onSuccess({ name: 'a', type: 'end' });

      assert.deepEqual(resolver.resolve(actions, byCondition), { type: 'end' });
    });

    specify('should return undefined when no action matches', function () {
      const actions = onSuccess({ name: 'a', type: 'end', criteria: [{ condition: 'fail' }] });

      assert.isUndefined(resolver.resolve(actions, byCondition));
    });

    specify('should return undefined when the action list is absent', function () {
      assert.isUndefined(resolver.resolve(undefined, always));
    });
  });

  context('normalization', function () {
    specify('should normalize an end action', function () {
      assert.deepEqual(resolver.resolve(onSuccess({ name: 'a', type: 'end' }), always), {
        type: 'end',
      });
    });

    specify('should normalize a goto to a stepId', function () {
      assert.deepEqual(
        resolver.resolve(onSuccess({ name: 'a', type: 'goto', stepId: 'next' }), always),
        { type: 'goto', workflowId: undefined, stepId: 'next' },
      );
    });

    specify('should normalize a goto to a workflowId', function () {
      assert.deepEqual(
        resolver.resolve(onFailure({ name: 'a', type: 'goto', workflowId: 'wf' }), always),
        { type: 'goto', workflowId: 'wf', stepId: undefined },
      );
    });

    specify('should normalize a retry with its bounds', function () {
      assert.deepEqual(
        resolver.resolve(
          onFailure({ name: 'a', type: 'retry', retryAfter: 3, retryLimit: 5 }),
          always,
        ),
        { type: 'retry', workflowId: undefined, stepId: undefined, retryAfter: 3, retryLimit: 5 },
      );
    });

    specify('should normalize a retry that transfers to a workflow', function () {
      assert.deepEqual(
        resolver.resolve(onFailure({ name: 'a', type: 'retry', workflowId: 'wf' }), always),
        {
          type: 'retry',
          workflowId: 'wf',
          stepId: undefined,
          retryAfter: undefined,
          retryLimit: undefined,
        },
      );
    });
  });
});
