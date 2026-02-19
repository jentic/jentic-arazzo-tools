import { SuccessAction, FailureAction } from '../types/index';

/**
 * Action with source information for display purposes
 */
export interface ActionWithSource {
  source: 'workflow' | 'step';
  isOverride?: boolean;
  stepIndex?: number;
  name: string;
  type: string;
  criteria?: any[];
  stepId?: string;
  workflowId?: string;
  retryLimit?: number;
  retryAfter?: number;
}

/**
 * Merge workflow-level and step-level actions for display.
 * Actions are identified by name + type. Step actions override workflow actions.
 *
 * Similar to parameter merging:
 * - Workflow actions appear first (if not overridden)
 * - Step actions appear after (including overrides)
 * - An action is overridden if name AND type match
 */
/**
 * Check if two actions are completely equal (for auto-removal of overrides)
 */
export function areActionsEqual(
  action1: SuccessAction | FailureAction,
  action2: SuccessAction | FailureAction,
): boolean {
  // Must have same name and type
  if (action1.name !== action2.name || action1.type !== action2.type) {
    return false;
  }

  // Compare all properties using JSON (includes criteria, stepId, workflowId, retryLimit, retryAfter)
  // Filter out undefined properties for fair comparison
  const clean1 = JSON.parse(JSON.stringify(action1));
  const clean2 = JSON.parse(JSON.stringify(action2));

  return JSON.stringify(clean1) === JSON.stringify(clean2);
}

export function mergeActionsForDisplay(
  workflowActions: (SuccessAction | FailureAction)[],
  stepActions: (SuccessAction | FailureAction)[],
): ActionWithSource[] {
  const result: ActionWithSource[] = [];

  // Add workflow actions that are NOT overridden (these appear first)
  workflowActions.forEach((workflowAction) => {
    const isOverridden = stepActions.some(
      (sa) => sa.name === workflowAction.name && sa.type === workflowAction.type,
    );

    if (!isOverridden) {
      result.push({
        ...workflowAction,
        source: 'workflow',
      } as ActionWithSource);
    }
  });

  // Add all step actions after workflow actions (these are editable)
  stepActions.forEach((stepAction, index) => {
    const overridesWorkflow = workflowActions.some(
      (wa) => wa.name === stepAction.name && wa.type === stepAction.type,
    );

    result.push({
      ...stepAction,
      source: 'step',
      isOverride: overridesWorkflow,
      stepIndex: index,
    } as ActionWithSource);
  });

  return result;
}
