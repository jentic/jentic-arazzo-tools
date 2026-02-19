import { ArazzoNode, ArazzoEdge } from '../types/viewer';

export interface SequentialLayoutOptions {
  direction?: 'RIGHT' | 'DOWN' | 'LEFT' | 'UP';
  nodeSpacing?: number;
}

/**
 * Apply sequential layout to nodes.
 *
 * Arazzo workflows have inherent sequential ordering - the step order in the
 * Arazzo document is semantically meaningful and should be preserved visually.
 * This is fundamentally different from typical DAGs where layout algorithms
 * determine node positions based on graph structure.
 *
 * This layout algorithm:
 * - Positions nodes in document order with consistent spacing
 * - Keeps spacing constant regardless of edge configuration
 * - Uses estimated heights based on node content
 * - Lets edge components handle their own routing (via getLeftRoutedPath)
 *
 * Why not use a graph layout library like ELK?
 * - ELK's layered algorithm optimizes for edge routing, not document order
 * - It creates "dummy nodes" for long edges that push layers apart
 * - Spacing varies based on edge configuration, which is confusing
 * - Arazzo's sequential semantics mean we want predictable, stable positions
 */
export function applySequentialLayout(
  nodes: ArazzoNode[],
  edges: ArazzoEdge[],
  options?: SequentialLayoutOptions,
): { nodes: ArazzoNode[]; edges: ArazzoEdge[] } {
  const direction = options?.direction || 'DOWN';
  const nodeGap = options?.nodeSpacing || 30; // Gap between nodes

  // All nodes have fixed width of 420px (set in node components)
  const fixedWidth = 420;

  // Calculate height for each node
  const nodeHeights = new Map<string, number>();
  nodes.forEach((node) => {
    nodeHeights.set(node.id, estimateNodeHeight(node));
  });

  // Separate main workflow nodes from external workflow nodes
  const mainNodes: ArazzoNode[] = [];
  const externalNodes: ArazzoNode[] = [];

  nodes.forEach((node) => {
    if (node.type === 'externalWorkflow') {
      externalNodes.push(node);
    } else {
      mainNodes.push(node);
    }
  });

  // Position main nodes sequentially
  // For DOWN direction: stack vertically, all at same X
  // For RIGHT direction: stack horizontally, all at same Y
  const isVertical = direction === 'DOWN' || direction === 'UP';

  let currentPosition = 0;
  const nodePositions = new Map<string, { x: number; y: number }>();

  const layoutedMainNodes = mainNodes.map((node) => {
    const height = nodeHeights.get(node.id) || 120;

    let position: { x: number; y: number };

    if (isVertical) {
      // Vertical layout: nodes stacked top to bottom
      // X is fixed at 0, Y increases
      position = {
        x: 0,
        y: currentPosition,
      };
      currentPosition += height + nodeGap;
    } else {
      // Horizontal layout: nodes stacked left to right
      // Y is fixed at 0, X increases
      position = {
        x: currentPosition,
        y: 0,
      };
      currentPosition += fixedWidth + nodeGap;
    }

    nodePositions.set(node.id, position);

    return {
      ...node,
      position,
    };
  });

  // Position external workflow nodes based on edges pointing to them
  // Success edges → position to the right of the source step
  // Failure/retry edges → position to the left of the source step
  const rightOffsets = new Map<string, number>();
  const leftOffsets = new Map<string, number>();

  const layoutedExternalNodes = externalNodes.map((node) => {
    // Find edge(s) pointing to this external workflow
    const incomingEdges = edges.filter((e) => e.target === node.id);
    if (incomingEdges.length === 0) {
      // No edges pointing to this - just put it somewhere
      return { ...node, position: { x: fixedWidth + 100, y: 0 } };
    }

    // Use the first edge to determine position
    const edge = incomingEdges[0];
    const sourcePos = nodePositions.get(edge.source);
    if (!sourcePos) {
      return { ...node, position: { x: fixedWidth + 100, y: 0 } };
    }

    const isFailure = edge.type === 'failure' || edge.type === 'retry';

    if (isFailure) {
      // Position to the left
      const offset = leftOffsets.get(edge.source) || 0;
      leftOffsets.set(edge.source, offset + 1);

      return {
        ...node,
        position: {
          x: -(fixedWidth + 60 + offset * (fixedWidth + 40)),
          y: sourcePos.y,
        },
      };
    } else {
      // Position to the right
      const offset = rightOffsets.get(edge.source) || 0;
      rightOffsets.set(edge.source, offset + 1);

      return {
        ...node,
        position: {
          x: fixedWidth + 60 + offset * (fixedWidth + 40),
          y: sourcePos.y,
        },
      };
    }
  });

  return { nodes: [...layoutedMainNodes, ...layoutedExternalNodes], edges };
}

/**
 * Estimate node height based on content.
 *
 * Height calculation is based on actual CSS rendering in node components:
 * - Each section has 12px padding top/bottom (24px total)
 * - Section borders add ~1px each
 * - Action cards have their own padding and margins
 *
 * We apply a 10% safety margin at the end to prevent overlap.
 */
function estimateNodeHeight(node: ArazzoNode): number {
  if (node.type === 'start' || node.type === 'end') {
    return estimateStartEndNodeHeight(node);
  }

  // Step nodes - calculate based on content
  const data = node.data as any;
  const step = data?.step;

  if (!step) return 140; // Fallback for nodes without step data

  // Base: Header (48px) + Operation section (48px) + border (4px)
  let height = 100;

  // Description: 12px padding + ~17px per line (fontSize 12px, lineHeight 1.4)
  // At 420px width with padding, estimate ~50 chars per line
  if (step.description) {
    const lines = Math.ceil(step.description.length / 50);
    height += 24 + Math.min(lines * 17, 85); // Cap at ~5 lines
  }

  // Parameters section: 24px padding + 18px header + 22px per item + overflow text
  if (step.parameters?.length > 0) {
    const shownParams = Math.min(step.parameters.length, 3);
    height += 24 + 18 + shownParams * 22;
    if (step.parameters.length > 3) height += 18; // "+N more..." text
  }

  // Outputs section: same structure as parameters
  if (step.outputs && Object.keys(step.outputs).length > 0) {
    const outputCount = Object.keys(step.outputs).length;
    const shownOutputs = Math.min(outputCount, 3);
    height += 24 + 18 + shownOutputs * 22;
    if (outputCount > 3) height += 18;
  }

  // Success criteria: 24px padding + ~20px content
  if (step.successCriteria?.length > 0) {
    height += 44;
  }

  // onSuccess actions: container padding + header + action cards
  if (step.onSuccess?.length > 0) {
    const actions = step.onSuccess.filter((a: any) => 'type' in a);
    if (actions.length > 0) {
      // Container: 24px padding + 20px header
      height += 44;
      // Each action card: 20px padding + ~20px name/type row + border
      // Plus ~16px if action has criteria
      actions.forEach((action: any) => {
        let actionHeight = 48; // Base card height (increased padding)
        if (action.criteria && action.criteria.length > 0) {
          actionHeight += 18; // Criteria text line
        }
        height += actionHeight;
      });
      // Gap between cards (n-1 gaps of 8px)
      if (actions.length > 1) {
        height += (actions.length - 1) * 8;
      }
    }
  }

  // onFailure actions: same structure as onSuccess
  if (step.onFailure?.length > 0) {
    const actions = step.onFailure.filter((a: any) => 'type' in a);
    if (actions.length > 0) {
      height += 44;
      actions.forEach((action: any) => {
        let actionHeight = 40;
        if (action.criteria && action.criteria.length > 0) {
          actionHeight += 18;
        }
        height += actionHeight;
      });
      if (actions.length > 1) {
        height += (actions.length - 1) * 8;
      }
    }
  }

  // Workflow-level inherited success actions
  if (data.workflowSuccessActions && data.workflowSuccessActions.length > 0) {
    // Filter for non-overridden workflow actions
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
      height += 44; // Header + padding
      inheritedActions.forEach((action: any) => {
        let actionHeight = 48; // Base card height (increased padding)
        if (action.criteria && action.criteria.length > 0) {
          actionHeight += 18;
        }
        height += actionHeight;
      });
      if (inheritedActions.length > 1) {
        height += (inheritedActions.length - 1) * 8; // Gap between actions
      }
    }
  }

  // Workflow-level inherited failure actions
  if (data.workflowFailureActions && data.workflowFailureActions.length > 0) {
    // Filter for non-overridden workflow actions
    const inheritedActions = data.workflowFailureActions
      .filter((a: any) => 'type' in a)
      .filter((workflowAction: any) => {
        return !step.onFailure?.some(
          (stepAction: any) =>
            'type' in stepAction &&
            stepAction.name === workflowAction.name &&
            stepAction.type === workflowAction.type,
        );
      });

    if (inheritedActions.length > 0) {
      height += 44; // Header + padding
      inheritedActions.forEach((action: any) => {
        let actionHeight = 48; // Base card height (increased padding)
        if (action.criteria && action.criteria.length > 0) {
          actionHeight += 18;
        }
        height += actionHeight;
      });
      if (inheritedActions.length > 1) {
        height += (inheritedActions.length - 1) * 12;
      }
    }
  }

  // Apply 20% safety margin to prevent overlap (increased for action cards with more padding)
  return Math.ceil(height * 1.2);
}

/**
 * Estimate height for start/end nodes which have simpler structure
 */
function estimateStartEndNodeHeight(node: ArazzoNode): number {
  let height = 160; // Base for start/end nodes

  const data = node.data as any;

  // Description
  if (data.description) {
    const lines = Math.ceil(data.description.length / 45);
    height += Math.min(lines * 17, 85);
  }

  // Inputs (start node)
  if (data.inputs?.properties) {
    const propCount = Object.keys(data.inputs.properties).length;
    height += Math.min(propCount * 24, 100);
  }

  // Outputs (end node)
  if (data.outputs) {
    const outputCount = Object.keys(data.outputs).length;
    height += Math.min(outputCount * 24, 100);
  }

  return Math.ceil(height * 1.2);
}
