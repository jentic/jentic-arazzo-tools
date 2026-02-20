import { ArazzoDocument } from '../../types/arazzo';
import { ArazzoNode, ArazzoEdge, WorkflowNodeData } from '../../types/viewer';

/**
 * Convert an Arazzo document to React Flow nodes for the document-level view.
 * Shows all workflows as clickable nodes in a grid layout.
 */
export function convertDocumentToFlow(
  document: ArazzoDocument,
  options?: {
    onWorkflowClick?: (workflowId: string) => void;
  },
): { nodes: ArazzoNode[]; edges: ArazzoEdge[] } {
  const nodes: ArazzoNode[] = [];
  const edges: ArazzoEdge[] = [];

  // Grid layout settings
  const nodeWidth = 280;
  const nodeHeight = 180;
  const horizontalGap = 60;
  const verticalGap = 40;
  const columns = 3; // Number of columns in grid

  // Create a node for each workflow in a grid layout
  document.workflows.forEach((workflow, index) => {
    const nodeId = `doc-workflow-${workflow._internalId || workflow.workflowId}`;

    // Calculate grid position
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = col * (nodeWidth + horizontalGap);
    const y = row * (nodeHeight + verticalGap);

    const node: ArazzoNode = {
      id: nodeId,
      type: 'workflow',
      position: { x, y },
      data: {
        type: 'workflow',
        workflow,
        onClick: options?.onWorkflowClick,
      } as WorkflowNodeData,
    };

    nodes.push(node);
  });

  // Create edges between workflows that reference each other
  document.workflows.forEach((workflow) => {
    const sourceNodeId = `doc-workflow-${workflow._internalId || workflow.workflowId}`;

    workflow.steps.forEach((step) => {
      // If a step references another workflow, create an edge
      if (step.workflowId) {
        const targetWorkflow = document.workflows.find((w) => w.workflowId === step.workflowId);
        if (targetWorkflow) {
          const targetNodeId = `doc-workflow-${targetWorkflow._internalId || targetWorkflow.workflowId}`;

          // Avoid self-loops and duplicate edges
          if (sourceNodeId !== targetNodeId) {
            const edgeId = `${sourceNodeId}->${targetNodeId}`;
            const existingEdge = edges.find((e) => e.id === edgeId);
            if (!existingEdge) {
              edges.push({
                id: edgeId,
                source: sourceNodeId,
                target: targetNodeId,
                type: 'sequential',
                data: { type: 'sequential' },
                animated: true,
                style: { stroke: '#94a3b8', strokeDasharray: '5,5' },
              });
            }
          }
        }
      }
    });
  });

  return { nodes, edges };
}
