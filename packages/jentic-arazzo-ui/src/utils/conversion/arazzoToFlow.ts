import { MarkerType } from 'reactflow';

import { Workflow, Step, ArazzoDocument } from '../../types/arazzo';
import {
  ArazzoNode,
  ArazzoEdge,
  StepNodeData,
  WorkflowRefNodeData,
  StartNodeData,
  EndNodeData,
  ExternalWorkflowNodeData,
  SequentialEdgeData,
  SuccessEdgeData,
  FailureEdgeData,
  BundledSuccessEdgeData,
  BundledFailureEdgeData,
  BundledRetryEdgeData,
  ConversionOptions,
} from '../../types/viewer';

/**
 * Convert an Arazzo workflow to React Flow nodes and edges.
 *
 * IMPORTANT: Node IDs now use internal IDs (UUIDs) instead of stepId/workflowId.
 * This provides stable selection during ID edits. The format is:
 * - Start node: `{workflowInternalId}-start`
 * - Step nodes: `{workflowInternalId}-{stepInternalId}`
 * - End node: `{workflowInternalId}-end`
 * - External workflow: `external-workflow-{workflowId}`
 */
export function convertWorkflowToFlow(
  workflow: Workflow,
  options?: ConversionOptions,
  document?: ArazzoDocument,
): { nodes: ArazzoNode[]; edges: ArazzoEdge[] } {
  const nodes: ArazzoNode[] = [];
  const edges: ArazzoEdge[] = [];

  const nodeSpacing = options?.layout?.nodeSpacing || 80;
  const direction = options?.layout?.direction || 'TB';
  const isVertical = ['TB', 'BT'].includes(direction);

  // Use workflow's internal ID for node ID prefix (stable during workflowId edits)
  const workflowInternalId = workflow._internalId || workflow.workflowId;

  // Create a map from stepId to step internal ID for edge target resolution
  const stepIdToInternalId = new Map<string, string>();
  workflow.steps.forEach((step) => {
    if (step._internalId) {
      stepIdToInternalId.set(step.stepId, step._internalId);
    }
  });

  // Helper to get node ID for a step (by its internal ID or stepId fallback)
  const getStepNodeId = (step: Step) => {
    const stepInternalId = step._internalId || step.stepId;
    return `${workflowInternalId}-${stepInternalId}`;
  };

  // Helper to resolve a stepId reference to a node ID
  const resolveStepIdToNodeId = (stepId: string) => {
    const internalId = stepIdToInternalId.get(stepId);
    if (internalId) {
      return `${workflowInternalId}-${internalId}`;
    }
    // Fallback to stepId-based ID (for external references or missing internal IDs)
    return `${workflow.workflowId}-${stepId}`;
  };

  // Track external workflows referenced in actions
  const externalWorkflowIds = new Set<string>();

  // Helper to get node ID for an external workflow
  const getExternalWorkflowNodeId = (workflowId: string) => {
    externalWorkflowIds.add(workflowId);
    return `external-workflow-${workflowId}`;
  };

  // Create start node
  const startNodeId = `${workflowInternalId}-start`;
  const startNode: ArazzoNode = {
    id: startNodeId,
    type: 'start',
    position: { x: 0, y: 0 },
    data: {
      type: 'start',
      workflowId: workflow.workflowId,
      inputs: workflow.inputs,
      description: workflow.description,
    } as StartNodeData,
  };
  nodes.push(startNode);

  // Create step nodes
  workflow.steps.forEach((step, index) => {
    const nodeId = getStepNodeId(step);

    // Determine node type
    const isWorkflowRef = !!step.workflowId;

    if (isWorkflowRef) {
      const node: ArazzoNode = {
        id: nodeId,
        type: 'workflowRef',
        position: isVertical
          ? { x: 0, y: (index + 1) * (200 + nodeSpacing) }
          : { x: (index + 1) * (350 + nodeSpacing), y: 0 },
        data: {
          type: 'workflowRef',
          step,
          targetWorkflowId: step.workflowId!,
          workflowSuccessActions: workflow.successActions,
          workflowFailureActions: workflow.failureActions,
          isValid: true,
        } as WorkflowRefNodeData,
      };
      nodes.push(node);
    } else {
      const node: ArazzoNode = {
        id: nodeId,
        type: 'step',
        position: isVertical
          ? { x: 0, y: (index + 1) * (200 + nodeSpacing) }
          : { x: (index + 1) * (350 + nodeSpacing), y: 0 },
        data: {
          type: 'step',
          step,
          workflowId: workflow.workflowId,
          workflowSuccessActions: workflow.successActions,
          workflowFailureActions: workflow.failureActions,
          isValid: validateStep(step),
          errors: [],
        } as StepNodeData,
      };
      nodes.push(node);
    }
  });

  // Create end node
  const endNodeId = `${workflowInternalId}-end`;
  const endNode: ArazzoNode = {
    id: endNodeId,
    type: 'end',
    position: isVertical
      ? { x: 0, y: (workflow.steps.length + 1) * (200 + nodeSpacing) }
      : { x: (workflow.steps.length + 1) * (350 + nodeSpacing), y: 0 },
    data: {
      type: 'end',
      workflowId: workflow.workflowId,
      outputs: workflow.outputs,
    } as EndNodeData,
  };
  nodes.push(endNode);

  // Create edges
  // Start to first step
  if (workflow.steps.length > 0) {
    const firstStepNodeId = getStepNodeId(workflow.steps[0]);
    edges.push({
      id: `${startNodeId}-to-${firstStepNodeId}`,
      source: startNodeId,
      target: firstStepNodeId,
      type: 'sequential',
      data: { type: 'sequential' } as SequentialEdgeData,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
    });
  }

  // Sequential edges between steps (default flow)
  workflow.steps.forEach((step, index) => {
    const sourceId = getStepNodeId(step);

    // Check for step-level success actions that GUARANTEE override (no criteria)
    // Actions with criteria are conditional, so sequential edge remains as fallback
    const hasStepSuccessOverride = step.onSuccess?.some((action) => {
      if ('type' in action && (action.type === 'goto' || action.type === 'end')) {
        // Only suppress sequential if action has NO criteria (guaranteed execution)
        return !action.criteria || action.criteria.length === 0;
      }
      return false;
    });

    // Check for workflow-level success actions that GUARANTEE override (no criteria)
    let hasWorkflowSuccessOverride = false;
    if (workflow.successActions && workflow.successActions.length > 0) {
      workflow.successActions.forEach((workflowAction) => {
        if (!('type' in workflowAction)) return;
        if (workflowAction.type !== 'goto' && workflowAction.type !== 'end') return;

        // Check if this workflow action is overridden by step
        const isOverridden = step.onSuccess?.some(
          (stepAction) =>
            'type' in stepAction &&
            stepAction.name === workflowAction.name &&
            stepAction.type === workflowAction.type,
        );

        // Only suppress sequential if action has NO criteria (guaranteed execution)
        if (!isOverridden && (!workflowAction.criteria || workflowAction.criteria.length === 0)) {
          hasWorkflowSuccessOverride = true;
        }
      });
    }

    const hasAnySuccessOverride = hasStepSuccessOverride || hasWorkflowSuccessOverride;

    // If no success actions or they don't override, create sequential edge to next step
    // Always use 'sequential' handle at bottom of card
    if (!hasAnySuccessOverride) {
      if (index < workflow.steps.length - 1) {
        const targetId = getStepNodeId(workflow.steps[index + 1]);
        edges.push({
          id: `${sourceId}-to-${targetId}`,
          source: sourceId,
          target: targetId,
          sourceHandle: 'sequential',
          type: 'sequential',
          data: { type: 'sequential' } as SequentialEdgeData,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
        });
      } else {
        // Last step to end
        edges.push({
          id: `${sourceId}-to-${endNodeId}`,
          source: sourceId,
          target: endNodeId,
          sourceHandle: 'sequential',
          type: 'sequential',
          data: { type: 'sequential' } as SequentialEdgeData,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
        });
      }
    }

    // Success action edges
    step.onSuccess?.forEach((action, actionIdx) => {
      if ('type' in action) {
        // Use action name or index for sourceHandle to match StepNode handles
        const handleId = `success-${action.name || actionIdx}`;

        if (action.type === 'goto') {
          let targetId: string;
          if (action.stepId) {
            targetId = resolveStepIdToNodeId(action.stepId);
          } else if (action.workflowId) {
            // External workflow reference - create external workflow node
            targetId = getExternalWorkflowNodeId(action.workflowId);
          } else {
            targetId = endNodeId;
          }

          edges.push({
            id: `${sourceId}-success-${actionIdx}`,
            source: sourceId,
            target: targetId,
            sourceHandle: handleId,
            type: 'success',
            label: action.name || undefined,
            data: {
              type: 'success',
              action,
              criteria: action.criteria,
            } as SuccessEdgeData,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
          });
        }
        // Note: 'end' actions don't create edges - they show a terminator badge in the node
      }
    });

    // Failure action edges
    step.onFailure?.forEach((action, actionIdx) => {
      if ('type' in action) {
        // Use action name or index for sourceHandle to match StepNode handles
        const handleId = `failure-${action.name || actionIdx}`;

        if (action.type === 'goto') {
          let targetId: string;
          if (action.stepId) {
            targetId = resolveStepIdToNodeId(action.stepId);
          } else if (action.workflowId) {
            // External workflow reference - create external workflow node
            targetId = getExternalWorkflowNodeId(action.workflowId);
          } else {
            targetId = endNodeId;
          }

          edges.push({
            id: `${sourceId}-failure-${actionIdx}`,
            source: sourceId,
            target: targetId,
            sourceHandle: handleId,
            type: 'failure',
            label: action.name || undefined,
            data: {
              type: 'failure',
              action,
              criteria: action.criteria,
            } as FailureEdgeData,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
          });
        } else if (action.type === 'retry') {
          // Retry targets either a specified step, workflow, or loops back to current step
          let retryTargetId: string;
          if (action.stepId) {
            retryTargetId = resolveStepIdToNodeId(action.stepId);
          } else if (action.workflowId) {
            // Cross-workflow retry - create external workflow node
            retryTargetId = getExternalWorkflowNodeId(action.workflowId);
          } else {
            // Default: retry current step
            retryTargetId = sourceId;
          }
          edges.push({
            id: `${sourceId}-retry-${actionIdx}`,
            source: sourceId,
            target: retryTargetId,
            sourceHandle: handleId,
            type: 'retry',
            label: action.name || undefined,
            data: {
              type: 'retry',
              action,
              retryAfter: action.retryAfter,
              retryLimit: action.retryLimit,
              criteria: action.criteria,
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
          });
        }
        // Note: 'end' actions don't create edges - they show a terminator badge in the node
      }
    });
  });

  // ==================================================================
  // WORKFLOW-LEVEL ACTION EDGES (INHERITED) - BUNDLED
  // ==================================================================
  // Collect all inherited actions and bundle them by (action, target)
  // This creates a single edge for each unique inherited action with multiple sources

  interface InheritedEdgeInfo {
    action: any;
    actionIdx: number;
    targetId: string;
    sources: Array<{ nodeId: string; handleId: string }>;
    edgeType: 'success' | 'failure' | 'retry';
  }

  const inheritedEdgeGroups = new Map<string, InheritedEdgeInfo>();

  // Collect all inherited action edges
  workflow.steps.forEach((step) => {
    const sourceId = getStepNodeId(step);

    // --- Workflow Success Actions ---
    if (workflow.successActions && workflow.successActions.length > 0) {
      workflow.successActions.forEach((workflowAction, actionIdx) => {
        if (!('type' in workflowAction)) return;
        if (workflowAction.type === 'end') return; // Skip end actions

        // Check if step overrides this action
        const stepOverrides = step.onSuccess?.some(
          (stepAction) =>
            'type' in stepAction &&
            stepAction.name === workflowAction.name &&
            stepAction.type === workflowAction.type,
        );

        if (!stepOverrides && workflowAction.type === 'goto') {
          let targetId: string;
          if (workflowAction.stepId) {
            targetId = resolveStepIdToNodeId(workflowAction.stepId);
          } else if (workflowAction.workflowId) {
            targetId = getExternalWorkflowNodeId(workflowAction.workflowId);
          } else {
            targetId = endNodeId;
          }

          const groupKey = `success-${workflowAction.name || actionIdx}-${targetId}`;
          const handleId = `workflow-success-${workflowAction.name || actionIdx}`;

          if (!inheritedEdgeGroups.has(groupKey)) {
            inheritedEdgeGroups.set(groupKey, {
              action: workflowAction,
              actionIdx,
              targetId,
              sources: [],
              edgeType: 'success',
            });
          }
          inheritedEdgeGroups.get(groupKey)!.sources.push({ nodeId: sourceId, handleId });
        }
      });
    }

    // --- Workflow Failure Actions ---
    if (workflow.failureActions && workflow.failureActions.length > 0) {
      workflow.failureActions.forEach((workflowAction, actionIdx) => {
        if (!('type' in workflowAction)) return;
        if (workflowAction.type === 'end') return; // Skip end actions

        // Check if step overrides this action
        const stepOverrides = step.onFailure?.some(
          (stepAction) =>
            'type' in stepAction &&
            stepAction.name === workflowAction.name &&
            stepAction.type === workflowAction.type,
        );

        if (!stepOverrides) {
          if (workflowAction.type === 'goto') {
            let targetId: string;
            if (workflowAction.stepId) {
              targetId = resolveStepIdToNodeId(workflowAction.stepId);
            } else if (workflowAction.workflowId) {
              targetId = getExternalWorkflowNodeId(workflowAction.workflowId);
            } else {
              targetId = endNodeId;
            }

            const groupKey = `failure-${workflowAction.name || actionIdx}-${targetId}`;
            const handleId = `workflow-failure-${workflowAction.name || actionIdx}`;

            if (!inheritedEdgeGroups.has(groupKey)) {
              inheritedEdgeGroups.set(groupKey, {
                action: workflowAction,
                actionIdx,
                targetId,
                sources: [],
                edgeType: 'failure',
              });
            }
            inheritedEdgeGroups.get(groupKey)!.sources.push({ nodeId: sourceId, handleId });
          } else if (workflowAction.type === 'retry') {
            let retryTargetId: string;
            if (workflowAction.stepId) {
              retryTargetId = resolveStepIdToNodeId(workflowAction.stepId);
            } else if (workflowAction.workflowId) {
              retryTargetId = getExternalWorkflowNodeId(workflowAction.workflowId);
            } else {
              // Self-retry: create individual edges per step (no bundling)
              const handleId = `workflow-failure-${workflowAction.name || actionIdx}`;
              edges.push({
                id: `${sourceId}-workflow-retry-${actionIdx}`,
                source: sourceId,
                target: sourceId,
                sourceHandle: handleId,
                type: 'retry',
                label: workflowAction.name || undefined,
                data: {
                  type: 'retry',
                  action: workflowAction,
                  retryAfter: workflowAction.retryAfter,
                  retryLimit: workflowAction.retryLimit,
                  criteria: workflowAction.criteria,
                  isInherited: true,
                },
              });
              return;
            }

            const groupKey = `retry-${workflowAction.name || actionIdx}-${retryTargetId}`;
            const handleId = `workflow-failure-${workflowAction.name || actionIdx}`;

            if (!inheritedEdgeGroups.has(groupKey)) {
              inheritedEdgeGroups.set(groupKey, {
                action: workflowAction,
                actionIdx,
                targetId: retryTargetId,
                sources: [],
                edgeType: 'retry',
              });
            }
            inheritedEdgeGroups.get(groupKey)!.sources.push({ nodeId: sourceId, handleId });
          }
        }
      });
    }
  });

  // Create bundled edges for groups with multiple sources
  inheritedEdgeGroups.forEach((group, groupKey) => {
    if (group.sources.length > 1) {
      // Bundle: multiple sources to same target
      if (group.edgeType === 'success') {
        edges.push({
          id: `bundled-${groupKey}`,
          source: group.sources[0].nodeId, // React Flow requires a source
          target: group.targetId,
          type: 'bundled-success',
          label: group.action.name || undefined,
          data: {
            type: 'bundled-success',
            action: group.action,
            criteria: group.action.criteria,
            sources: group.sources,
            actionIdx: group.actionIdx,
          } as BundledSuccessEdgeData,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
        });
      } else if (group.edgeType === 'failure') {
        edges.push({
          id: `bundled-${groupKey}`,
          source: group.sources[0].nodeId,
          target: group.targetId,
          type: 'bundled-failure',
          label: group.action.name || undefined,
          data: {
            type: 'bundled-failure',
            action: group.action,
            criteria: group.action.criteria,
            sources: group.sources,
            actionIdx: group.actionIdx,
          } as BundledFailureEdgeData,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
        });
      } else if (group.edgeType === 'retry') {
        edges.push({
          id: `bundled-${groupKey}`,
          source: group.sources[0].nodeId,
          target: group.targetId,
          type: 'bundled-retry',
          label: group.action.name || undefined,
          data: {
            type: 'bundled-retry',
            action: group.action,
            retryAfter: group.action.retryAfter,
            retryLimit: group.action.retryLimit,
            criteria: group.action.criteria,
            sources: group.sources,
            actionIdx: group.actionIdx,
          } as BundledRetryEdgeData,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
        });
      }
    } else if (group.sources.length === 1) {
      // Single source: create regular edge (not bundled)
      const source = group.sources[0];
      if (group.edgeType === 'success') {
        edges.push({
          id: `${source.nodeId}-workflow-success-${group.actionIdx}`,
          source: source.nodeId,
          target: group.targetId,
          sourceHandle: source.handleId,
          type: 'success',
          label: group.action.name || undefined,
          data: {
            type: 'success',
            action: group.action,
            criteria: group.action.criteria,
            isInherited: true,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
        });
      } else if (group.edgeType === 'failure') {
        edges.push({
          id: `${source.nodeId}-workflow-failure-${group.actionIdx}`,
          source: source.nodeId,
          target: group.targetId,
          sourceHandle: source.handleId,
          type: 'failure',
          label: group.action.name || undefined,
          data: {
            type: 'failure',
            action: group.action,
            criteria: group.action.criteria,
            isInherited: true,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
        });
      } else if (group.edgeType === 'retry') {
        edges.push({
          id: `${source.nodeId}-workflow-retry-${group.actionIdx}`,
          source: source.nodeId,
          target: group.targetId,
          sourceHandle: source.handleId,
          type: 'retry',
          label: group.action.name || undefined,
          data: {
            type: 'retry',
            action: group.action,
            retryAfter: group.action.retryAfter,
            retryLimit: group.action.retryLimit,
            criteria: group.action.criteria,
            isInherited: true,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
        });
      }
    }
  });

  // Create external workflow nodes for any workflows referenced in actions
  externalWorkflowIds.forEach((externalWorkflowId) => {
    const nodeId = `external-workflow-${externalWorkflowId}`;
    // Look up the workflow in the document if available
    const externalWorkflow = document?.workflows.find((w) => w.workflowId === externalWorkflowId);

    const externalNode: ArazzoNode = {
      id: nodeId,
      type: 'externalWorkflow',
      position: { x: 0, y: 0 }, // Layout will position this
      data: {
        type: 'externalWorkflow',
        workflowId: externalWorkflowId,
        workflow: externalWorkflow,
        // onClick could be added here to navigate to the workflow
      } as ExternalWorkflowNodeData,
    };
    nodes.push(externalNode);
  });

  // Return nodes with initial positions - sequential layout will handle positioning
  return { nodes, edges };
}

function validateStep(step: Step): boolean {
  // Basic validation
  if (!step.stepId) return false;

  // Must have one of: operationId, operationPath, or workflowId
  const hasOperation = !!(step.operationId || step.operationPath || step.workflowId);
  if (!hasOperation) return false;

  return true;
}
