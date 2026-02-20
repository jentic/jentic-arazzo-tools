import { ArazzoDocument, SuccessAction, FailureAction } from '../types/index';

/**
 * Get all action names in a workflow (excluding actions from a specific step)
 * Includes both step-level actions and workflow-level actions
 */
export function getExistingActionNames(
  document: ArazzoDocument,
  workflowId: string | null,
  excludeStepInternalId?: string,
): string[] {
  const currentWorkflow = document.workflows.find((w) => w.workflowId === workflowId);
  if (!currentWorkflow) return [];

  const names: string[] = [];

  // Collect workflow-level success actions
  const workflowSuccessActions = (currentWorkflow.successActions || []).filter(
    (a): a is SuccessAction => 'type' in a && 'name' in a,
  );
  names.push(...workflowSuccessActions.map((a) => a.name));

  // Collect workflow-level failure actions
  const workflowFailureActions = (currentWorkflow.failureActions || []).filter(
    (a): a is FailureAction => 'type' in a && 'name' in a,
  );
  names.push(...workflowFailureActions.map((a) => a.name));

  // Collect step-level actions
  for (const step of currentWorkflow.steps) {
    // Skip the current step being edited
    if (excludeStepInternalId && step._internalId === excludeStepInternalId) continue;

    // Collect names from onSuccess actions
    const successActions = (step.onSuccess || []).filter(
      (a): a is SuccessAction => 'type' in a && 'name' in a,
    );
    names.push(...successActions.map((a) => a.name));

    // Collect names from onFailure actions
    const failureActions = (step.onFailure || []).filter(
      (a): a is FailureAction => 'type' in a && 'name' in a,
    );
    names.push(...failureActions.map((a) => a.name));
  }
  return names;
}

/**
 * Generate a unique action name based on type and context
 */
export function generateActionName(
  type: 'end' | 'goto' | 'retry',
  isSuccess: boolean,
  existingNames: string[],
  targetStepId?: string,
): string {
  let baseName: string;
  if (type === 'end') {
    baseName = isSuccess ? 'endSuccess' : 'endFailure';
  } else if (type === 'goto') {
    baseName = targetStepId
      ? `goto${targetStepId.charAt(0).toUpperCase()}${targetStepId.slice(1)}`
      : isSuccess
        ? 'gotoSuccess'
        : 'gotoFailure';
  } else {
    baseName = 'retryAction';
  }

  // Ensure uniqueness
  let name = baseName;
  let counter = 1;
  while (existingNames.includes(name)) {
    name = `${baseName}${counter++}`;
  }

  return name;
}

/**
 * Validate that an action name is unique and not empty
 * @param name - The name to validate
 * @param existingNames - Names from other steps in the workflow
 * @param otherActionName - (Legacy) Single other action name to check against
 * @param siblingNames - Names of other actions in the same list (for multiple actions)
 */
export function validateActionName(
  name: string,
  existingNames: string[],
  otherActionName?: string,
  siblingNames?: string[],
): string | null {
  if (!name.trim()) {
    return 'Action name is required';
  }

  // Check against other action's name (legacy single-action mode)
  if (otherActionName && name === otherActionName) {
    return 'Name must be unique within the workflow';
  }

  // Check against sibling actions in the same list
  if (siblingNames && siblingNames.includes(name)) {
    return 'Name must be unique within the action list';
  }

  if (existingNames.includes(name)) {
    return 'Name already used in this workflow';
  }

  return null;
}
