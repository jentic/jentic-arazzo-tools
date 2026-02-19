import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { ReactFlowProvider } from 'reactflow';
import { parseArazzo } from '@jentic/arazzo-parser';
import { dereferenceArazzoElement } from '@jentic/arazzo-resolver';
import { toValue } from '@speclynx/apidom-core';

import { ArazzoViewerProvider, useArazzoViewer } from './context/ArazzoViewerContext';
import { DiagramView, DiagramViewRef } from './components/DiagramView';
import { DocsView } from './components/DocsView';
import { ArazzoDocument, ArazzoViewerProps, ArazzoViewerRef, ViewerMode } from './types/index';
import { stripInternalIds } from './utils/internalIds';

async function parseDocument(input: ArazzoDocument | string): Promise<ArazzoDocument> {
  const parseResult = await parseArazzo(input as any, {}); // eslint-disable-line @typescript-eslint/no-explicit-any
  const dereferenced = await dereferenceArazzoElement(parseResult, {
    parse: {
      parserOpts: {
        sourceDescriptions: false,
      },
    },
    resolve: {
      baseURI: document.baseURI,
    },
    dereference: {
      circular: 'error',
      immutable: false,
    },
  });
  return toValue(dereferenced.result) as ArazzoDocument;
}

/**
 * ArazzoViewer - Interactive viewer for Arazzo workflow specifications
 *
 * Renders diagram and documentation views of an Arazzo document.
 * Supports click-to-select, workflow switching, zoom/pan.
 * No document mutation capability.
 *
 * The `document` prop accepts:
 * - An `ArazzoDocument` object (rendered immediately)
 * - A JSON or YAML string (parsed via @jentic/arazzo-parser)
 * - A file path or HTTP(S) URL (fetched and parsed via @jentic/arazzo-parser)
 */
export const ArazzoViewer = forwardRef<ArazzoViewerRef, ArazzoViewerProps>(
  function ArazzoViewer(props, ref) {
    const {
      document: rawDocument,
      view = 'diagram',
      activeWorkflowId: controlledWorkflowId,
      selectedNodeId: controlledSelectedNodeId,
      className,
      style,
      onNodeSelect,
      onEdgeSelect,
      onWorkflowSelect,
      onViewChange,
    } = props;

    const [parsedDocument, setParsedDocument] = useState<ArazzoDocument | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let cancelled = false;

      setLoading(true);
      setError(null);

      parseDocument(rawDocument)
        .then((doc) => {
          if (!cancelled) {
            setParsedDocument(doc);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : String(err));
            setParsedDocument(null);
            setLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }, [rawDocument]);

    const events = useMemo(
      () => ({
        onNodeSelect,
        onEdgeSelect,
        onWorkflowSelect,
        onViewChange,
      }),
      [onNodeSelect, onEdgeSelect, onWorkflowSelect, onViewChange],
    );

    if (loading) {
      return (
        <div
          className={`arazzo-viewer ${className ?? ''}`}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            fontSize: '14px',
            ...style,
          }}
        >
          Loading document...
        </div>
      );
    }

    if (error || !parsedDocument) {
      return (
        <div
          className={`arazzo-viewer ${className ?? ''}`}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#dc2626',
            fontSize: '14px',
            padding: '24px',
            ...style,
          }}
        >
          {error || 'Failed to load document'}
        </div>
      );
    }

    return (
      <div
        className={`arazzo-viewer ${className ?? ''}`}
        style={{ width: '100%', height: '100%', display: 'flex', ...style }}
      >
        <ArazzoViewerProvider
          document={parsedDocument}
          initialActiveWorkflowId={controlledWorkflowId}
          initialSelectedNodeId={controlledSelectedNodeId}
          events={events}
        >
          <ReactFlowProvider>
            <ArazzoViewerInner ref={ref} view={view} />
          </ReactFlowProvider>
        </ArazzoViewerProvider>
      </div>
    );
  },
);

interface ArazzoViewerInnerProps {
  view: ViewerMode;
}

const ArazzoViewerInner = forwardRef<ArazzoViewerRef, ArazzoViewerInnerProps>(
  function ArazzoViewerInner({ view }, ref) {
    const diagramRef = useRef<DiagramViewRef>(null);
    const ctx = useArazzoViewer();

    useImperativeHandle(
      ref,
      () => ({
        fitView: () => diagramRef.current?.fitView(),
        setZoom: (level: number) => diagramRef.current?.setZoom(level),
        getDocument: () => stripInternalIds(ctx.document),
        setActiveWorkflow: (id: string | null) => ctx.setActiveWorkflow(id),
        selectStep: (stepId: string) => {
          // Find the node ID for this step
          const node = ctx.nodes.find(
            (n) => n.data?.type === 'step' && 'step' in n.data && n.data.step.stepId === stepId,
          );
          if (node) {
            ctx.setSelectedNode(node.id);
          }
        },
        clearSelection: () => ctx.setSelectedNode(null),
        getActiveWorkflowId: () => ctx.activeWorkflowId,
        getSelectedStepId: () => {
          if (!ctx.selectedNodeId) return null;
          const node = ctx.nodes.find((n) => n.id === ctx.selectedNodeId);
          if (node?.data?.type === 'step' && 'step' in node.data) {
            return node.data.step.stepId;
          }
          return null;
        },
      }),
      [ctx],
    );

    const showDiagram = view === 'diagram' || view === 'split';
    const showDocs = view === 'docs' || view === 'split';

    return (
      <>
        {showDiagram && (
          <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
            <DiagramView ref={diagramRef} showWorkflowTabs={true} />
          </div>
        )}
        {showDocs && (
          <div style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'auto' }}>
            <DocsView />
          </div>
        )}
      </>
    );
  },
);
