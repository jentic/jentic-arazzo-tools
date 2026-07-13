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
 * The action selected for a step outcome — a Success or Failure Action element.
 * @public
 */
export type SelectedAction = SuccessActionElement | FailureActionElement;

/**
 * Selects the action to take for a step outcome from its `onSuccess` /
 * `onFailure` list.
 *
 * Actions are tried in order; the first whose `criteria` all pass is returned
 * (an action with no criteria always matches). The selected action element is
 * returned as-is — interpreting it (branching on `type`, reading
 * `stepId`/`workflowId`/`retryAfter`/`retryLimit`) is the caller's concern, and
 * keeping it an element preserves the document provenance. Returns `undefined`
 * when no action matches (or the list is absent), leaving the caller to apply
 * the path default — the next sequential step on success, break-and-return on
 * failure.
 *
 * Reusable Object entries are already inlined by workflow normalization, so the
 * list contains only concrete action elements.
 * @public
 */
class ActionResolver {
  /**
   * Returns the first action whose criteria are all met, or `undefined` when
   * none match.
   */
  resolve(
    actions: StepOnSuccessElement | StepOnFailureElement | undefined,
    isCriterionMet: CriterionPredicate,
  ): SelectedAction | undefined {
    if (actions === undefined) return undefined;

    for (const action of actions) {
      if (!isSuccessActionElement(action) && !isFailureActionElement(action)) continue;
      if (this.#criteriaMet(action, isCriterionMet)) {
        return action;
      }
    }

    return undefined;
  }

  /**
   * Whether every criterion of the action passes. An action with no criteria
   * matches vacuously; a malformed (non-Criterion) entry fails the action
   * rather than being skipped.
   */
  #criteriaMet(action: SelectedAction, isCriterionMet: CriterionPredicate): boolean {
    const criteria = action.criteria;
    if (criteria === undefined) return true;

    for (const criterion of criteria) {
      if (!isCriterionElement(criterion) || !isCriterionMet(criterion)) return false;
    }
    return true;
  }
}

export default ActionResolver;
