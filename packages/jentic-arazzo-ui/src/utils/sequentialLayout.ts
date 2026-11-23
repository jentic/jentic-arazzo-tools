import { ArazzoNode, ArazzoEdge } from '../types/viewer';
import { getRequestBodyView } from './documentation/requestBodyView';
import { REQUEST_BODY_SECTION_HEIGHT } from './nodeLayout';
import { workflowRows } from './workflowRows';

export interface SequentialLayoutOptions {
  direction?: 'RIGHT' | 'DOWN' | 'LEFT' | 'UP';
  nodeSpacing?: number;
}

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

  const successTargets = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (edge.type !== 'success' && edge.type !== 'sequential' && edge.type !== 'bundled-success')
      continue;
    const sources =
      edge.data?.type === 'bundled-success'
        ? edge.data.sources.map((s) => s.nodeId)
        : [edge.source];
    for (const source of sources) {
      if (!successTargets.has(source)) successTargets.set(source, new Set());
      successTargets.get(source)!.add(edge.target);
    }
  }
  const branchTargets = new Set(
    [...successTargets.values()].filter((set) => set.size > 1).flatMap((set) => [...set]),
  );
  const externalBranches = new Set(
    nodes
      .filter((node) => node.type === 'externalWorkflow' && branchTargets.has(node.id))
      .map((node) => node.id),
  );
  nodes.forEach((node) => {
    if (!externalBranches.has(node.id) && node.type === 'externalWorkflow') {
      externalNodes.push(node);
    } else {
      mainNodes.push(node);
    }
  });

  const isVertical = direction === 'DOWN' || direction === 'UP';
  const nodePositions = new Map<string, { x: number; y: number }>();
  let currentPosition = 0;
  let minX = 0;
  let maxX = 0;

  const rows = workflowRows(mainNodes, edges);
  const placements = rows.flat();
  const lanePitch = (isVertical ? fixedWidth : Math.max(0, ...nodeHeights.values())) + nodeGap;
  const firstMainLane = Math.min(0, ...placements.filter((p) => !p.recovery).map((p) => p.lane));
  const lastRecoveryLane = Math.max(0, ...placements.filter((p) => p.recovery).map((p) => p.lane));
  const successes = new Map<string, ArazzoEdge[]>();
  for (const edge of edges) {
    if (edge.type !== 'success') continue;
    if (!successes.has(edge.target)) successes.set(edge.target, []);
    successes.get(edge.target)!.push(edge);
  }
  const tracks = new Map<string, number>();
  for (const row of rows) {
    // give edges entering the same row separate label heights, including edges to different siblings.
    const approaches = row.flatMap(({ node }) => successes.get(node.id) ?? []);
    approaches.forEach((edge, track) => tracks.set(edge.id, track));
    currentPosition += Math.max(0, approaches.length - 1) * 24;
    for (const { node, lane, recovery } of row) {
      const offset = lanePitch * (lane + (recovery ? firstMainLane - lastRecoveryLane - 1 : 0));
      const position = isVertical
        ? { x: offset, y: currentPosition }
        : { x: currentPosition, y: offset };
      nodePositions.set(node.id, position);
      minX = Math.min(minX, position.x);
      maxX = Math.max(maxX, position.x);
    }
    currentPosition +=
      (isVertical ? Math.max(...row.map(({ node }) => nodeHeights.get(node.id)!)) : fixedWidth) +
      nodeGap;
  }
  const layoutedMainNodes = mainNodes.map((node) => ({
    ...node,
    position: nodePositions.get(node.id)!,
  }));

  // Position external workflow nodes based on edges pointing to them
  // Success edges → position to the right of the source step
  // Failure/retry edges → position to the left of the source step
  const rightOffsets = new Map<number, number>();
  const leftOffsets = new Map<number, number>();

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
      const offset = leftOffsets.get(sourcePos.y) || 0;
      leftOffsets.set(sourcePos.y, offset + 1);

      return {
        ...node,
        position: {
          x: minX - (fixedWidth + 60 + offset * (fixedWidth + 40)),
          y: sourcePos.y,
        },
      };
    } else {
      // Position to the right
      const offset = rightOffsets.get(sourcePos.y) || 0;
      rightOffsets.set(sourcePos.y, offset + 1);

      return {
        ...node,
        position: {
          x: maxX + fixedWidth + 60 + offset * (fixedWidth + 40),
          y: sourcePos.y,
        },
      };
    }
  });

  const routedEdges = edges.map((edge) => {
    const track = tracks.get(edge.id);
    const targetHandle = externalBranches.has(edge.target) ? 'branch' : edge.targetHandle;
    if (track === undefined || edge.data?.type !== 'success')
      return targetHandle === edge.targetHandle ? edge : { ...edge, targetHandle };
    return { ...edge, targetHandle, data: { ...edge.data, labelTrack: track } };
  });
  return { nodes: [...layoutedMainNodes, ...layoutedExternalNodes], edges: routedEdges };
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

  // Request body section (same visibility condition as StepNode)
  if (getRequestBodyView(step.requestBody)) {
    height += REQUEST_BODY_SECTION_HEIGHT;
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
