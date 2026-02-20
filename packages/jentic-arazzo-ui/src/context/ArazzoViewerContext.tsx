import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  ArazzoDocument,
  Workflow,
  ArazzoNode,
  ArazzoEdge,
  ArazzoViewerContextValue,
  ViewerEvents,
} from '../types/index';
import { convertWorkflowToFlow, convertDocumentToFlow } from '../utils/conversion/index';
import { applySequentialLayout } from '../utils/sequentialLayout';
import { assignInternalIds } from '../utils/internalIds';

const ArazzoViewerContext = createContext<ArazzoViewerContextValue | null>(null);

export const useArazzoViewer = () => {
  const context = useContext(ArazzoViewerContext);
  if (!context) {
    throw new Error('useArazzoViewer must be used within ArazzoViewerProvider');
  }
  return context;
};

// ============================================================================
// Injected Mode Provider — passes through pre-computed values
// ============================================================================

interface InjectedProviderProps {
  value: ArazzoViewerContextValue;
  children: React.ReactNode;
}

// ============================================================================
// Standalone Mode Provider — computes nodes/edges from document
// ============================================================================

interface StandaloneProviderProps {
  document: ArazzoDocument;
  documentURL?: string | null;
  initialActiveWorkflowId?: string | null;
  initialSelectedNodeId?: string | null;
  events?: ViewerEvents;
  children: React.ReactNode;
}

// ============================================================================
// Combined Provider
// ============================================================================

type ArazzoViewerProviderProps =
  | ({ value: ArazzoViewerContextValue } & { children: React.ReactNode })
  | ({
      document: ArazzoDocument;
      documentURL?: string | null;
      initialActiveWorkflowId?: string | null;
      initialSelectedNodeId?: string | null;
      events?: ViewerEvents;
    } & { children: React.ReactNode });

function isInjectedMode(props: ArazzoViewerProviderProps): props is InjectedProviderProps {
  return 'value' in props && props.value != null;
}

export const ArazzoViewerProvider: React.FC<ArazzoViewerProviderProps> = (props) => {
  if (isInjectedMode(props)) {
    return (
      <ArazzoViewerContext.Provider value={props.value}>
        {props.children}
      </ArazzoViewerContext.Provider>
    );
  }

  return <StandaloneProvider {...props} />;
};

const StandaloneProvider: React.FC<StandaloneProviderProps> = ({
  document: rawDocument,
  documentURL = null,
  initialActiveWorkflowId,
  initialSelectedNodeId,
  events,
  children,
}) => {
  // Assign internal IDs for stable node ID generation
  const document = useMemo(() => assignInternalIds(rawDocument), [rawDocument]);

  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(
    initialActiveWorkflowId ?? document.workflows[0]?.workflowId ?? null,
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    initialSelectedNodeId ?? null,
  );
  const [nodes, setNodes] = useState<ArazzoNode[]>([]);
  const [edges, setEdges] = useState<ArazzoEdge[]>([]);

  // Sync controlled props
  useEffect(() => {
    if (initialActiveWorkflowId !== undefined) {
      setActiveWorkflowId(initialActiveWorkflowId);
    }
  }, [initialActiveWorkflowId]);

  useEffect(() => {
    if (initialSelectedNodeId !== undefined) {
      setSelectedNodeId(initialSelectedNodeId);
    }
  }, [initialSelectedNodeId]);

  // Memoize activeWorkflow to prevent unnecessary re-renders
  const activeWorkflowRef = useRef<Workflow | null>(null);
  const activeWorkflowHashRef = useRef<string>('');

  const activeWorkflow = useMemo(() => {
    const workflow = document.workflows.find((w) => w.workflowId === activeWorkflowId) || null;
    const workflowHash = workflow ? JSON.stringify(workflow) : '';

    if (workflowHash !== activeWorkflowHashRef.current) {
      activeWorkflowHashRef.current = workflowHash;
      activeWorkflowRef.current = workflow;
      return workflow;
    }

    return activeWorkflowRef.current;
  }, [document, activeWorkflowId]);

  // Ref to hold the navigation handler for external workflow nodes
  const navigateToWorkflowRef = useRef<(workflowId: string) => void>(() => {});
  navigateToWorkflowRef.current = (workflowId: string) => {
    setActiveWorkflowId(workflowId);
    setSelectedNodeId(null);
  };

  // Store document in a ref to avoid regenerating the diagram
  // when non-workflow parts of the document change
  const currentDocRef = useRef(document);
  currentDocRef.current = document;

  // Convert active workflow to React Flow nodes/edges with sequential layout
  useEffect(() => {
    if (activeWorkflow) {
      const { nodes: flowNodes, edges: flowEdges } = convertWorkflowToFlow(
        activeWorkflow,
        {},
        currentDocRef.current,
      );

      const { nodes: layoutedNodes, edges: layoutedEdges } = applySequentialLayout(
        flowNodes,
        flowEdges,
        { direction: 'DOWN' },
      );

      // Add onClick handlers to external workflow nodes for navigation
      const nodesWithHandlers = layoutedNodes.map((node) => {
        if (node.type === 'externalWorkflow') {
          return {
            ...node,
            data: {
              ...node.data,
              onClick: (workflowId: string) => navigateToWorkflowRef.current(workflowId),
            },
          };
        }
        return node;
      });

      setNodes(nodesWithHandlers);
      setEdges(layoutedEdges);
    } else if (currentDocRef.current.workflows?.length > 0) {
      // Show document-level view with workflow nodes
      const { nodes: docNodes, edges: docEdges } = convertDocumentToFlow(currentDocRef.current, {
        onWorkflowClick: (workflowId) => setActiveWorkflowId(workflowId),
      });
      setNodes(docNodes);
      setEdges(docEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [activeWorkflow]);

  const setActiveWorkflow = useCallback(
    (id: string | null) => {
      setActiveWorkflowId(id);
      setSelectedNodeId(null);
      events?.onWorkflowSelect?.(id ?? '');
    },
    [events],
  );

  const setSelectedNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  const value: ArazzoViewerContextValue = {
    document,
    documentURL,
    activeWorkflowId,
    setActiveWorkflow,
    activeWorkflow,
    selectedNodeId,
    setSelectedNode,
    nodes,
    edges,
    setNodes,
    setEdges,
    readOnly: true,
    events,
  };

  return <ArazzoViewerContext.Provider value={value}>{children}</ArazzoViewerContext.Provider>;
};
