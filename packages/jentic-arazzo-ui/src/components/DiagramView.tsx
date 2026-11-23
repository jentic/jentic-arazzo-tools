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
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  useReactFlow,
  useNodesInitialized,
  useStore,
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
import { ErrorBoundary, RenderErrorNotice } from './ErrorBoundary';
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
    document,
    diagramError,
  } = useArazzoViewer();
  const reactFlow = useReactFlow();
  // the diagram recovers from a render error when another workflow or document is shown
  const diagramResetKey = useMemo(() => [document, activeWorkflowId], [document, activeWorkflowId]);

  const measured = useNodesInitialized();
  const paneWidth = useStore((state) => state.width);
  const paneHeight = useStore((state) => state.height);
  const initialView = useRef<string | null>(null);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    fitView: () => {
      reactFlow.fitView({ padding: 0.2 });
    },
    setZoom: (level: number) => {
      reactFlow.zoomTo(level);
    },
  }));

  const left = Math.min(0, ...nodes.map((node) => node.position.x));
  const bundleMargin = edges.reduce(
    (max, edge) =>
      edge.data?.type === 'bundled-success' ? Math.max(max, 120 + edge.data.actionIdx * 40) : max,
    0,
  );
  const right =
    Math.max(0, ...nodes.map((node) => node.position.x + (node.width ?? 420))) + bundleMargin;
  const fitWidthZoom = paneWidth / (right - left + 80);
  const start = nodes.find((node) => node.type === 'start') ?? nodes[0];
  const branched =
    start?.type === 'start' && nodes.some((node) => node.position.x !== start.position.x);

  const showOverview = branched && fitWidthZoom < 0.6;

  useEffect(() => {
    if (!start || !measured || !reactFlow.viewportInitialized || !paneWidth || !paneHeight) return;
    if (start.data.type === 'start' && start.data.workflowId !== activeWorkflowId) return;
    const key = start.id;
    if (initialView.current === key) return;
    initialView.current = key;

    if (branched) {
      const zoom = showOverview ? 0.8 : Math.min(0.8, fitWidthZoom);
      const center = showOverview
        ? start.position.x + (start.width ?? 420) / 2
        : (right + left) / 2;
      reactFlow.setViewport({
        x: paneWidth / 2 - center * zoom,
        y: 24 - start.position.y * zoom,
        zoom,
      });
    } else {
      const zoom = 0.8;
      reactFlow.setCenter(start.position.x + 150, start.position.y + 100 + 250 / zoom, { zoom });
    }
  }, [
    start,
    branched,
    showOverview,
    measured,
    paneWidth,
    paneHeight,
    fitWidthZoom,
    left,
    right,
    reactFlow,
    activeWorkflowId,
  ]);

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
      {showWorkflowTabs && (
        <ErrorBoundary label="The workflow tabs" resetKey={document}>
          <WorkflowTabs onWorkflowSelect={events?.onWorkflowSelect} />
        </ErrorBoundary>
      )}

      {diagramError && (
        <div style={{ padding: '0 12px' }}>
          <RenderErrorNotice label="This workflow's diagram" message={diagramError} />
        </div>
      )}

      {/* React Flow Canvas */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ErrorBoundary label="The diagram" resetKey={diagramResetKey}>
          <ReactFlow
            nodes={nodesWithSelection}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            minZoom={branched && fitWidthZoom > 0 ? Math.min(0.1, fitWidthZoom) : 0.1}
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
            {showOverview && <MiniMap pannable zoomable ariaLabel="Workflow overview" />}
          </ReactFlow>
        </ErrorBoundary>
      </div>
    </div>
  );
});

export default DiagramView;
