import { toValue } from '@speclynx/apidom-core';
import { isStringElement, isNumberElement } from '@speclynx/apidom-datamodel';
import {
  isSuccessActionElement,
  isFailureActionElement,
  isCriterionElement,
  type StepOnSuccessElement,
  type StepOnFailureElement,
  type SuccessActionElement,
  type FailureActionElement,
  type CriterionElement,
} from '@speclynx/apidom-ns-arazzo-1';

/**
 * Determines whether a single criterion is met.
 *
 * Bridged to a criterion evaluator
 * (`(criterion) => criterionEvaluator.evaluate(criterion, resolve)`); an
 * unresolvable/failing criterion is `false`, not an error.
 * @public
 */
export type CriterionPredicate = (criterion: CriterionElement) => boolean;

/**
 * The action selected for a step outcome, normalized from a Success/Failure
 * Action Object. `goto` transfers control to `workflowId` or `stepId`
 * (mutually exclusive); `retry` re-runs the current step, bounded by
 * `retryAfter`/`retryLimit`, optionally transferring to `workflowId`/`stepId`
 * first; `end` terminates the workflow.
 * @public
 */
export type ResolvedAction =
  | { readonly type: 'end' }
  | { readonly type: 'goto'; readonly workflowId?: string; readonly stepId?: string }
  | {
      readonly type: 'retry';
      readonly workflowId?: string;
      readonly stepId?: string;
      readonly retryAfter?: number;
      readonly retryLimit?: number;
    };

/**
 * Selects the action to take for a step outcome from its `onSuccess` /
 * `onFailure` list.
 *
 * Actions are tried in order; the first whose `criteria` all pass is selected
 * (an action with no criteria always matches). The selected Success/Failure
 * Action Object is normalized to a {@link ResolvedAction}. Returns `undefined`
 * when no action matches (or the list is absent), leaving the caller to apply
 * the path default — the next sequential step on success, break-and-return on
 * failure.
 *
 * Reusable Object entries are already inlined by workflow normalization, so the
 * list contains only concrete action elements. Retry accounting (the retry
 * counter, and exhausting `retryLimit` before subsequent failure actions) is
 * stateful loop control owned by the executor, not decided here.
 * @public
 */
class ActionResolver {
  /**
   * Returns the first action whose criteria are all met, normalized, or
   * `undefined` when none match.
   */
  resolve(
    actions: StepOnSuccessElement | StepOnFailureElement | undefined,
    isCriterionMet: CriterionPredicate,
  ): ResolvedAction | undefined {
    if (actions === undefined) return undefined;

    for (const action of actions) {
      if (!isSuccessActionElement(action) && !isFailureActionElement(action)) continue;
      if (this.#criteriaMet(action, isCriterionMet)) {
        return this.#normalize(action);
      }
    }

    return undefined;
  }

  /**
   * Whether every criterion of the action passes. An action with no criteria
   * matches vacuously.
   */
  #criteriaMet(
    action: SuccessActionElement | FailureActionElement,
    isCriterionMet: CriterionPredicate,
  ): boolean {
    const criteria = action.criteria;
    if (criteria === undefined) return true;

    for (const criterion of criteria) {
      if (isCriterionElement(criterion) && !isCriterionMet(criterion)) return false;
    }
    return true;
  }

  /**
   * Normalizes a Success/Failure Action Object to a {@link ResolvedAction}.
   */
  #normalize(action: SuccessActionElement | FailureActionElement): ResolvedAction {
    const type = toValue(action.type) as string;
    const workflowId = isStringElement(action.workflowId)
      ? (toValue(action.workflowId) as string)
      : undefined;
    const stepId = isStringElement(action.stepId) ? (toValue(action.stepId) as string) : undefined;

    if (type === 'goto') return { type: 'goto', workflowId, stepId };

    if (type === 'retry') {
      const retry = action as FailureActionElement;
      const retryAfter = isNumberElement(retry.retryAfter)
        ? (toValue(retry.retryAfter) as number)
        : undefined;
      const retryLimit = isNumberElement(retry.retryLimit)
        ? (toValue(retry.retryLimit) as number)
        : undefined;
      return { type: 'retry', workflowId, stepId, retryAfter, retryLimit };
    }

    return { type: 'end' };
  }
}

export default ActionResolver;
