import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { ReactFlowProvider } from 'reactflow';
import {
  parseArazzo,
  attachStepOperations,
  defaultParseArazzoOptions,
  type ParseArazzoOptions,
} from '@jentic/arazzo-parser';
import {
  dereferenceArazzoElement,
  dereferenceSourceDescriptionPathItems,
} from '@jentic/arazzo-resolver';

import { ArazzoViewerProvider, useArazzoViewer } from './context/ArazzoViewerContext';
import { DiagramView, DiagramViewRef } from './components/DiagramView';
import { DocsView } from './components/DocsView';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { ArazzoDocument, ArazzoUIProps, ArazzoUIRef, ViewerMode } from './types/index';

export type {
  ArazzoUIProps,
  ArazzoUIRef,
  ViewerMode,
  DiagramType,
  ArazzoNode,
  ArazzoNodeData,
  StepNodeData,
  StepOperation,
  ViewerStep,
  WorkflowRefNodeData,
  StartNodeData,
  EndNodeData,
  WorkflowNodeData,
  ExternalWorkflowNodeData,
  ArazzoEdge,
  ArazzoEdgeData,
  SequentialEdgeData,
  SuccessEdgeData,
  FailureEdgeData,
  RetryEdgeData,
  BundledSuccessEdgeData,
  BundledFailureEdgeData,
  BundledRetryEdgeData,
  ValidationError,
} from './types/index';
export type {
  ArazzoDocument,
  InfoObject,
  SourceDescription,
  Workflow,
  Step,
  Parameter,
  RequestBody,
  PayloadReplacement,
  SuccessAction,
  FailureAction,
  Criterion,
  CriterionExpressionType,
  ReusableObject,
  ComponentsObject,
  JSONSchema,
} from './types/arazzo';
import { stripInternalIds } from './utils/internalIds';
import { validateArazzoSource, type ValidationState } from './utils/validation';
import {
  loadDocumentSource,
  PrefetchedResolver,
  type DocumentSource,
} from './utils/documentSource';
import { normalizeDocumentShape, type NormalizedDocument } from './utils/documentShape';

import './styles/index.css';
import { injectTheme } from './styles/theme';

injectTheme();

function detectUrl(value: ArazzoDocument | string): string | null {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim()) ? value.trim() : null;
}

async function parseDocument(source: DocumentSource): Promise<NormalizedDocument> {
  // OpenAPI specs from sourceDescriptions are parsed from the client's browser to retrieve HTTP
  // methods for steps. If the server hosting the spec does not include Access-Control-Allow-Origin
  // headers, the browser blocks the fetch and no method badges are shown. Failure to load the
  // OpenAPI spec is not fatal.
  const options: ParseArazzoOptions = {
    parse: { parserOpts: { sourceDescriptions: true } },
    resolve: { baseURI: document.baseURI },
  };
  const parseResult =
    source.kind === 'url'
      ? // parse by URL, so source descriptions resolve against it, but serve the text already
        // fetched for validation instead of requesting the document again
        await parseArazzo(source.uri, {
          ...options,
          resolve: {
            ...options.resolve,
            resolvers: [
              new PrefetchedResolver(source),
              ...(defaultParseArazzoOptions.resolve?.resolvers ?? []),
            ],
          },
        } as ParseArazzoOptions)
      : source.kind === 'object'
        ? await parseArazzo(source.object as unknown as Record<string, unknown>, options)
        : await parseArazzo(source.content, options);
  // Path Items that are only a $ref (local or external) are resolved so their methods are found;
  // an unresolvable Path Item just gets no badge. The viewer also displays invalid documents, so
  // their invalid parts are skipped (skipInvalid) here and below, and reported by validation.
  await dereferenceSourceDescriptionPathItems(parseResult, { skipInvalid: true });
  let element = parseResult.result;
  try {
    const dereferenced = await dereferenceArazzoElement(parseResult, {
      resolve: {
        baseURI: document.baseURI,
      },
      dereference: {
        circular: 'error',
        immutable: false,
      },
    });
    element = dereferenced.result;
  } catch {
    // a reference that can't be resolved (e.g. to a missing `$components` entry) would otherwise
    // hide the whole document; show references as written instead, validation reports them
  }
  return normalizeDocumentShape(
    attachStepOperations<ArazzoDocument>(element, parseResult, { skipInvalid: true }),
  );
}

/**
 * ArazzoUI - Interactive viewer for Arazzo workflow specifications
 *
 * Renders diagram and documentation views of an Arazzo document.
 * Supports click-to-select, workflow switching, zoom/pan.
 * No document mutation capability.
 *
 * The `document` prop accepts:
 * - An `ArazzoDocument` object (rendered immediately)
 * - A JSON or YAML string (parsed via \@jentic/arazzo-parser)
 * - A file path or HTTP(S) URL (fetched and parsed via \@jentic/arazzo-parser)
 *
 * @public
 */
export const ArazzoUI = forwardRef<ArazzoUIRef, ArazzoUIProps>(function ArazzoUI(props, ref) {
  const {
    document: rawDocument,
    view = 'docs',
    activeWorkflowId: controlledWorkflowId,
    selectedNodeId: controlledSelectedNodeId,
    className,
    style,
    onNodeSelect,
    onEdgeSelect,
    onWorkflowSelect,
    onViewChange,
    ignoreUnsupportedVersion = false,
  } = props;

  const documentURL = detectUrl(rawDocument);
  // loaded once per document and shared, so a document given by URL is fetched once and the
  // validation results describe the same revision that is rendered
  const documentSource = useMemo(() => loadDocumentSource(rawDocument), [rawDocument]);
  const [normalized, setNormalized] = useState<NormalizedDocument | null>(null);
  const parsedDocument = normalized?.document ?? null;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    documentSource
      .then(parseDocument)
      .then((doc) => {
        if (!cancelled) {
          setNormalized(doc);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setNormalized(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [documentSource]);

  const [rawValidation, setValidation] = useState<ValidationState>({ status: 'loading' });

  // diagnostics point into the source document; normalizing an invalid one can drop workflows or
  // steps, so their paths are remapped onto what is displayed before notes are placed inline
  const validation = useMemo<ValidationState>(() => {
    if (rawValidation.status !== 'done' || !normalized) return rawValidation;
    return {
      ...rawValidation,
      diagnostics: rawValidation.diagnostics.map((diagnostic) =>
        diagnostic.path
          ? { ...diagnostic, path: normalized.remapPath(diagnostic.path) }
          : diagnostic,
      ),
    };
  }, [rawValidation, normalized]);

  // only the docs view shows validation results, so the validator (and the source descriptions it
  // fetches) isn't loaded until the docs view is first shown; it then stays validated
  const [docsShown, setDocsShown] = useState(view !== 'diagram');
  if (!docsShown && view !== 'diagram') setDocsShown(true);

  useEffect(() => {
    if (!docsShown) return;
    let cancelled = false;

    setValidation({ status: 'loading' });

    documentSource
      .then((source) => validateArazzoSource(source, { ignoreUnsupportedVersion }))
      .then((result) => {
        if (!cancelled) setValidation(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setValidation({
            status: 'error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [documentSource, ignoreUnsupportedVersion, docsShown]);

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
        className={`arazzo-ui ${className ?? ''}`}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--arazzo-muted-fg)',
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
        className={`arazzo-ui ${className ?? ''}`}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          ...style,
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            padding: '16px 24px',
            borderRadius: '8px',
            border: '1px solid var(--arazzo-danger-border)',
            background: 'var(--arazzo-danger-bg)',
            color: 'var(--arazzo-danger)',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
        >
          {error || 'Failed to load document'}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`arazzo-ui ${className ?? ''}`}
      style={{ width: '100%', height: '100%', display: 'flex', ...style }}
    >
      <ArazzoViewerProvider
        document={parsedDocument}
        documentURL={documentURL}
        initialActiveWorkflowId={controlledWorkflowId}
        initialSelectedNodeId={controlledSelectedNodeId}
        events={events}
      >
        <ReactFlowProvider>
          <ArazzoUIInner ref={ref} view={view} validation={validation} />
        </ReactFlowProvider>
      </ArazzoViewerProvider>
    </div>
  );
});

interface ArazzoUIInnerProps {
  view: ViewerMode;
  validation: ValidationState;
}

const ArazzoUIInner = forwardRef<ArazzoUIRef, ArazzoUIInnerProps>(function ArazzoUIInner(
  { view, validation },
  ref,
) {
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
          <ErrorBoundary label="The diagram view" resetKey={ctx.document}>
            <DiagramView ref={diagramRef} showWorkflowTabs={true} />
          </ErrorBoundary>
        </div>
      )}
      {showDocs && (
        <div style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'auto' }}>
          <ErrorBoundary label="The docs view" resetKey={ctx.document}>
            <DocsView validation={validation} />
          </ErrorBoundary>
        </div>
      )}
    </>
  );
});
