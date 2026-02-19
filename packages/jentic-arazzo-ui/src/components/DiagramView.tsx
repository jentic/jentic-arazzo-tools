import React, {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  useReactFlow,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useArazzoViewer } from '../context/ArazzoViewerContext';
import {
  StepNode,
  WorkflowRefNode,
  StartNode,
  EndNode,
  WorkflowNode,
  ExternalWorkflowNode,
} from '../nodes/index';
import {
  SequentialEdge,
  SuccessEdge,
  FailureEdge,
  RetryEdge,
  BundledSuccessEdge,
  BundledFailureEdge,
  BundledRetryEdge,
} from '../edges/index';
import { WorkflowTabs } from './WorkflowTabs';
import { ArazzoNode, ArazzoEdge } from '../types/index';
import { ErrorBoundary } from './ErrorBoundary';
import './WorkflowTabs.css';

const nodeTypes = {
  step: StepNode,
  workflowRef: WorkflowRefNode,
  start: StartNode,
  end: EndNode,
  workflow: WorkflowNode,
  externalWorkflow: ExternalWorkflowNode,
};

const edgeTypes = {
  sequential: SequentialEdge,
  success: SuccessEdge,
  failure: FailureEdge,
  retry: RetryEdge,
  'bundled-success': BundledSuccessEdge,
  'bundled-failure': BundledFailureEdge,
  'bundled-retry': BundledRetryEdge,
};

export interface DiagramViewRef {
  fitView: () => void;
  setZoom: (level: number) => void;
}

export interface DiagramViewProps {
  /** Show workflow tabs for switching between workflows */
  showWorkflowTabs?: boolean;
}

/**
 * DiagramView - React Flow diagram wrapper for Arazzo workflows
 */
export const DiagramView = forwardRef<DiagramViewRef, DiagramViewProps>(function DiagramView(
  { showWorkflowTabs = true },
  ref,
) {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    events,
    selectedNodeId,
    setSelectedNode,
    activeWorkflowId,
  } = useArazzoViewer();
  const reactFlow = useReactFlow();

  // Track which workflow we've set the view for
  const viewSetForWorkflow = useRef<string | null>(null);
  // Track if React Flow has initialized on this mount
  const reactFlowInitialized = useRef<boolean>(false);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    fitView: () => {
      reactFlow.fitView({ padding: 0.2 });
    },
    setZoom: (level: number) => {
      reactFlow.zoomTo(level);
    },
  }));

  // Called when React Flow is initialized and ready
  const onInit = useCallback(
    (instance: ReactFlowInstance) => {
      reactFlowInitialized.current = true;
      // Center view when React Flow initializes
      setTimeout(() => {
        const startNode = nodes.find((n) => n.type === 'start') || nodes[0];
        if (startNode && startNode.position) {
          const zoom = 0.8;
          const targetX = startNode.position.x + 150;
          const targetY = startNode.position.y + 100;
          const yOffset = 250;

          instance.setCenter(targetX, targetY + yOffset / zoom, { zoom, duration: 300 });
        }
      }, 50);
    },
    [nodes],
  );

  // Set view when workflow changes (while already in diagram view)
  useEffect(() => {
    const currentView = activeWorkflowId ?? 'document';
    const workflowChanged = viewSetForWorkflow.current !== currentView;

    if (nodes.length === 0 || !reactFlowInitialized.current) {
      return;
    }

    if (workflowChanged) {
      viewSetForWorkflow.current = currentView;

      // When switching workflows, position start node near top
      const startNode = nodes.find((n) => n.type === 'start') || nodes[0];
      if (startNode && startNode.position) {
        setTimeout(() => {
          const zoom = 0.8;
          const targetX = startNode.position.x + 150;
          const targetY = startNode.position.y + 100;
          const yOffset = 250;

          reactFlow.setCenter(targetX, targetY + yOffset / zoom, { zoom, duration: 0 });
        }, 50);
      }
    }
  }, [nodes, reactFlow, activeWorkflowId]);

  // Store current nodes/edges in refs for stable callbacks
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes(applyNodeChanges(changes, nodesRef.current) as ArazzoNode[]);
    },
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(applyEdgeChanges(changes, edgesRef.current) as ArazzoEdge[]);
    },
    [setEdges],
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: (typeof nodes)[0]) => {
      setSelectedNode(node.id);
      if (events?.onNodeSelect) {
        events.onNodeSelect(node.id, node);
      }
    },
    [setSelectedNode, events],
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: (typeof edges)[0]) => {
      // Navigate to target node for goto conditionals
      if (edge.data?.type === 'success' || edge.data?.type === 'failure') {
        const action = edge.data.action;
        const isEnd = action?.type === 'end';
        const isRetry = action?.type === 'retry';

        if (!isEnd && !isRetry && edge.target) {
          const targetNode = nodes.find((n) => n.id === edge.target);
          if (targetNode && targetNode.position) {
            setSelectedNode(edge.target);
            setTimeout(() => {
              reactFlow.setCenter(targetNode.position.x + 150, targetNode.position.y + 100, {
                zoom: reactFlow.getZoom(),
                duration: 300,
              });
            }, 0);
          }
        }
      }

      if (events?.onEdgeSelect) {
        events.onEdgeSelect(edge.id, edge);
      }
    },
    [events, nodes, reactFlow, setSelectedNode],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  // Handle double-click to center on node
  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: (typeof nodes)[0]) => {
      const nodePosition = node.position;
      if (nodePosition) {
        reactFlow.setCenter(nodePosition.x + 150, nodePosition.y + 100, { zoom: 1, duration: 300 });
      }
    },
    [reactFlow],
  );

  // Track previous selection to detect external selection changes
  const prevSelectedNodeId = useRef<string | null>(null);

  // Center on node when selection changes from outside
  useEffect(() => {
    if (selectedNodeId && selectedNodeId !== prevSelectedNodeId.current) {
      const node = nodes.find((n) => n.id === selectedNodeId);
      if (node && node.position) {
        reactFlow.setCenter(node.position.x + 150, node.position.y + 100, {
          zoom: reactFlow.getZoom(),
          duration: 300,
        });
      }
    }
    prevSelectedNodeId.current = selectedNodeId;
  }, [selectedNodeId, nodes, reactFlow]);

  // Memoize nodes with selection state
  const nodesWithSelection = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        selected: n.id === selectedNodeId,
      })),
    [nodes, selectedNodeId],
  );

  return (
    <div
      className="arazzo-diagram-view"
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Workflow Tabs */}
      {showWorkflowTabs && <WorkflowTabs onWorkflowSelect={events?.onWorkflowSelect} />}

      {/* React Flow Canvas */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ErrorBoundary>
          <ReactFlow
            nodes={nodesWithSelection}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={onInit}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            minZoom={0.1}
            maxZoom={2}
            nodesDraggable={true}
            nodesConnectable={false}
            defaultEdgeOptions={{
              type: 'straight',
              style: { strokeWidth: 2 },
            }}
            panOnScroll={true}
            selectionOnDrag={false}
            panActivationKeyCode={null}
            selectionKeyCode={null}
            deleteKeyCode={null}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </ErrorBoundary>
      </div>
    </div>
  );
});

export default DiagramView;
