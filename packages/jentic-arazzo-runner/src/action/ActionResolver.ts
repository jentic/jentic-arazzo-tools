import {
  isSuccessActionElement,
  isFailureActionElement,
  isCriterionElement,
  type StepOnSuccessElement,
  type StepOnFailureElement,
  type WorkflowSuccessActionsElement,
  type WorkflowFailureActionsElement,
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
    actions:
      | StepOnSuccessElement
      | StepOnFailureElement
      | WorkflowSuccessActionsElement
      | WorkflowFailureActionsElement
      | undefined,
    isCriterionMet: CriterionPredicate,
  ): SelectedAction | undefined {
    return this.resolveAll(actions, isCriterionMet)[0];
  }

  /**
   * Returns every action whose criteria are all met, in list order.
   *
   * Where {@link ActionResolver.resolve} yields only the first match, this
   * surfaces the whole matching chain — the caller that must honor "retryLimit
   * exhausted prior to subsequent failure actions" walks it, falling from an
   * exhausted `retry` to the next matching action without re-evaluating criteria.
   * Empty when the list is absent or nothing matches.
   */
  resolveAll(
    actions:
      | StepOnSuccessElement
      | StepOnFailureElement
      | WorkflowSuccessActionsElement
      | WorkflowFailureActionsElement
      | undefined,
    isCriterionMet: CriterionPredicate,
  ): SelectedAction[] {
    if (actions === undefined) return [];

    const matched: SelectedAction[] = [];
    for (const action of actions) {
      if (!isSuccessActionElement(action) && !isFailureActionElement(action)) continue;
      if (this.#criteriaMet(action, isCriterionMet)) {
        matched.push(action);
      }
    }

    return matched;
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
