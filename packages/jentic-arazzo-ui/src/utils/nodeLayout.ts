import { ArazzoNode } from '../types/viewer';

/**
 * Calculate the Y offset for the inherited success action section within a step node.
 * This matches the layout logic in StepNode.tsx to find where inherited actions are rendered.
 */
export function getInheritedSuccessActionYOffset(node: ArazzoNode): number {
  if (node.type !== 'step') return 80; // Fallback for non-step nodes

  const data = node.data as any;
  const step = data?.step;
  if (!step) return 80;

  let yOffset = 0;

  // Header: ~50px
  yOffset += 50;

  // Operation section: ~50px
  yOffset += 50;

  // Inputs section
  if (step.parameters?.length > 0) {
    const shownParams = Math.min(step.parameters.length, 3);
    yOffset += 24 + 18 + shownParams * 22;
    if (step.parameters.length > 3) yOffset += 18;
  }

  // Outputs section
  if (step.outputs && Object.keys(step.outputs).length > 0) {
    const outputCount = Object.keys(step.outputs).length;
    const shownOutputs = Math.min(outputCount, 3);
    yOffset += 24 + 18 + shownOutputs * 22;
    if (outputCount > 3) yOffset += 18;
  }

  // Success criteria section
  if (step.successCriteria?.length > 0) {
    yOffset += 44;
  }

  // Step-level onSuccess actions
  if (step.onSuccess?.length > 0) {
    const actions = step.onSuccess.filter((a: any) => 'type' in a);
    if (actions.length > 0) {
      yOffset += 44; // Header + padding
      actions.forEach((action: any) => {
        let actionHeight = 48; // Increased padding
        if (action.criteria && action.criteria.length > 0) {
          actionHeight += 18;
        }
        yOffset += actionHeight;
      });
      if (actions.length > 1) {
        yOffset += (actions.length - 1) * 8;
      }
    }
  }

  // Add half the header height of the inherited section to position in the middle
  yOffset += 22; // Half of the header section

  return yOffset;
}

/**
 * Calculate the Y offset for the inherited failure action section within a step node.
 */
export function getInheritedFailureActionYOffset(node: ArazzoNode): number {
  if (node.type !== 'step') return 80; // Fallback for non-step nodes

  const data = node.data as any;
  const step = data?.step;
  if (!step) return 80;

  // Start with the offset after inherited success actions
  let yOffset = getInheritedSuccessActionYOffset(node) - 22; // Remove the half-header we added

  // Add inherited success actions section height
  if (data.workflowSuccessActions && data.workflowSuccessActions.length > 0) {
    const inheritedActions = data.workflowSuccessActions
      .filter((a: any) => 'type' in a)
      .filter((workflowAction: any) => {
        return !step.onSuccess?.some(
          (stepAction: any) =>
            'type' in stepAction &&
            stepAction.name === workflowAction.name &&
            stepAction.type === workflowAction.type,
        );
      });

    if (inheritedActions.length > 0) {
      yOffset += 44; // Header + padding
      inheritedActions.forEach((action: any) => {
        let actionHeight = 48;
        if (action.criteria && action.criteria.length > 0) {
          actionHeight += 18;
        }
        yOffset += actionHeight;
      });
      if (inheritedActions.length > 1) {
        yOffset += (inheritedActions.length - 1) * 8;
      }
    }
  }

  // Step-level onFailure actions
  if (step.onFailure?.length > 0) {
    const actions = step.onFailure.filter((a: any) => 'type' in a);
    if (actions.length > 0) {
      yOffset += 44;
      actions.forEach((action: any) => {
        let actionHeight = 48;
        if (action.criteria && action.criteria.length > 0) {
          actionHeight += 18;
        }
        yOffset += actionHeight;
      });
      if (actions.length > 1) {
        yOffset += (actions.length - 1) * 8;
      }
    }
  }

  // Add half the header height of the inherited section to position in the middle
  yOffset += 22;

  return yOffset;
}
