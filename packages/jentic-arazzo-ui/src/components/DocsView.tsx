import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';
import { useArazzoViewer } from '../context/ArazzoViewerContext';
import {
  generateDocumentation,
  generateMermaidSequence,
  generateMermaidFlowchart,
} from '../utils/documentation/index';

export interface DocsViewProps {
  diagramType?: string;
  onDiagramTypeChange?: (type: string) => void;
}

type WorkflowViewMode = 'docs' | 'sequence' | 'flowchart';

let mermaidIdCounter = 0;

function getHiddenContainer(): HTMLDivElement {
  let el = globalThis.document.getElementById('mermaid-sandbox') as HTMLDivElement | null;
  if (!el) {
    el = globalThis.document.createElement('div');
    el.id = 'mermaid-sandbox';
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    el.style.top = '-9999px';
    el.style.visibility = 'hidden';
    el.style.overflow = 'hidden';
    el.style.height = '0';
    el.style.width = '0';
    globalThis.document.body.appendChild(el);
  }
  return el;
}

const MermaidDiagram: React.FC<{ source: string }> = ({ source }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-diagram-${++mermaidIdCounter}`;
    const sandbox = getHiddenContainer();

    mermaid.render(id, source, sandbox).then(
      ({ svg }) => {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      },
      () => {
        // render failed, leave empty
      },
    );

    return () => {
      cancelled = true;
    };
  }, [source]);

  return <div ref={containerRef} className="mermaid-rendered" />;
};

const markdownPlugins = [remarkGfm];
const rehypePlugins = [rehypeHighlight, rehypeRaw];

export const DocsView: React.FC<DocsViewProps> = () => {
  const { document, documentURL } = useArazzoViewer();
  const mermaidInitialized = useRef(false);
  const docsContainerRef = useRef<HTMLDivElement>(null);
  const [workflowViews, setWorkflowViews] = useState<Record<string, WorkflowViewMode>>({});
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());

  const getWorkflowView = useCallback(
    (workflowId: string): WorkflowViewMode => workflowViews[workflowId] || 'docs',
    [workflowViews],
  );

  const setWorkflowView = useCallback(
    (workflowId: string, view: WorkflowViewMode) =>
      setWorkflowViews((prev) => ({ ...prev, [workflowId]: view })),
    [],
  );

  const handleToggle = useCallback(
    (workflowId: string, e: React.SyntheticEvent<HTMLDetailsElement>) => {
      const isOpen = (e.currentTarget as HTMLDetailsElement).open;
      if (isOpen) {
        setExpandedWorkflows((prev) => new Set(prev).add(workflowId));
      }
      // sync allExpanded state by checking DOM
      const container = docsContainerRef.current;
      if (container) {
        const details = container.querySelectorAll('.workflow-details');
        setAllExpanded(Array.from(details).every((d) => (d as HTMLDetailsElement).open));
      }
    },
    [],
  );

  // Initialize Mermaid
  useEffect(() => {
    if (!mermaidInitialized.current) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: { useMaxWidth: true, htmlLabels: true },
      });
      mermaidInitialized.current = true;
    }
  }, []);

  // Generate documentation (memoized)
  const documentation = useMemo(() => {
    if (!document) return null;
    return generateDocumentation(document, {
      includeMetadata: true,
      includeDiagrams: false,
      documentURL,
    });
  }, [document, documentURL]);

  // Pre-generate all diagrams (memoized)
  const sequenceDiagrams = useMemo(() => {
    if (!document) return new Map<string, string>();
    const diagrams = new Map<string, string>();
    document.workflows.forEach((workflow) => {
      diagrams.set(workflow.workflowId, generateMermaidSequence(workflow, document));
    });
    return diagrams;
  }, [document]);

  const flowchartDiagrams = useMemo(() => {
    if (!document) return new Map<string, string>();
    const diagrams = new Map<string, string>();
    document.workflows.forEach((workflow) => {
      diagrams.set(workflow.workflowId, generateMermaidFlowchart(workflow));
    });
    return diagrams;
  }, [document]);

  // Handle expand/collapse all button
  const [allExpanded, setAllExpanded] = useState(false);

  const handleExpandAll = useCallback(() => {
    const container = docsContainerRef.current;
    if (!container) return;
    const details = container.querySelectorAll('.workflow-details');
    const allOpen = Array.from(details).every((d) => (d as HTMLDetailsElement).open);
    details.forEach((d) => {
      (d as HTMLDetailsElement).open = !allOpen;
    });
    setAllExpanded(!allOpen);
    if (!allOpen && document) {
      setExpandedWorkflows(
        (prev) => new Set([...prev, ...document.workflows.map((w) => w.workflowId)]),
      );
    }
  }, [document]);

  if (!document || !documentation) {
    return (
      <div className="arazzo-docs-view">
        <div style={{ padding: '24px', color: '#6b7280' }}>No workflow loaded</div>
      </div>
    );
  }

  const viewModes: WorkflowViewMode[] = ['docs', 'sequence', 'flowchart'];
  const viewLabels: Record<WorkflowViewMode, string> = {
    docs: 'Docs',
    sequence: 'Sequence',
    flowchart: 'Flowchart',
  };

  return (
    <div
      className="arazzo-docs-view"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div
        ref={docsContainerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px 48px',
          background: '#f9fafb',
        }}
      >
        <style>{`
          .workflow-details {
            background: white;
            border-radius: 8px;
            margin-bottom: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
            overflow: hidden;
          }

          .workflow-details[open] {
            border-color: #93c5fd;
          }

          .workflow-summary-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 20px;
            cursor: pointer;
            user-select: none;
            list-style: none;
            background: #eef6ff;
            transition: background 0.15s;
          }

          .workflow-summary-bar::-webkit-details-marker {
            display: none;
          }

          .workflow-summary-bar::before {
            content: '▶';
            font-size: 10px;
            color: #61affe;
            transition: transform 0.15s;
            flex-shrink: 0;
          }

          .workflow-details[open] > .workflow-summary-bar::before {
            transform: rotate(90deg);
          }

          .workflow-summary-bar:hover {
            background: #e0f0ff;
          }

          .workflow-summary-title {
            font-size: 15px;
            font-weight: 700;
            color: #111827;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          }

          .workflow-summary-text {
            font-size: 13px;
            color: #6b7280;
            flex: 1;
          }

          .workflow-details-content {
            padding: 4px 20px 20px;
            border-top: 1px solid #e5e7eb;
          }

          .workflow-view-toggle {
            display: flex;
            gap: 0;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 16px;
            margin-top: 8px;
          }

          .workflow-view-btn {
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 500;
            border: none;
            background: none;
            color: #9ca3af;
            cursor: pointer;
            transition: all 0.15s;
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
          }

          .workflow-view-btn:hover {
            color: #374151;
          }

          .workflow-view-btn-active {
            color: #111827;
            font-weight: 600;
            border-bottom-color: #111827;
          }

          .workflow-description {
            color: #4b5563;
            margin: 16px 0;
            line-height: 1.6;
          }

          .doc-section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
          }

          .sources-section {
            margin: 40px 0;
          }

          .sources-header {
            font-size: 13px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 10px;
          }

          .workflows-header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 40px;
            margin-bottom: 10px;
          }

          .expand-all-btn {
            font-size: 12px;
            font-weight: 500;
            color: #6b7280;
            background: none;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 3px 10px;
            cursor: pointer;
            transition: all 0.15s;
          }

          .expand-all-btn:hover {
            color: #374151;
            border-color: #9ca3af;
            background: #f9fafb;
          }

          .sources-grid {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }

          .source-card {
            flex: 1;
            min-width: 240px;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 14px 16px;
            transition: border-color 0.15s, box-shadow 0.15s;
          }

          .source-card:hover {
            border-color: #93c5fd;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
          }

          .source-card-top {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
          }

          .source-type-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          .source-type-openapi {
            background: #49cc90;
            color: #fff;
          }

          .source-type-arazzo {
            background: #61affe;
            color: #fff;
          }

          .source-name {
            font-size: 15px;
            font-weight: 600;
            color: #111827;
          }

          .source-url {
            display: block;
            font-size: 12px;
            color: #6b7280;
            text-decoration: none;
            word-break: break-all;
          }

          .source-url:hover {
            color: #3b82f6;
            text-decoration: underline;
          }

          .doc-section h3 {
            margin-top: 0;
            color: #111827;
            font-size: 1.1rem;
            font-weight: 600;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 16px;
          }

          /* Timeline */
          .timeline {
            position: relative;
            padding: 8px 0;
          }

          .timeline-item {
            display: flex;
            gap: 16px;
            min-height: 80px;
          }

          .timeline-item-last {
            min-height: auto;
          }

          .timeline-marker {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex-shrink: 0;
            width: 28px;
          }

          .timeline-dot {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #fef3c7;
            border: 1px solid #fde68a;
            flex-shrink: 0;
            font-size: 11px;
            font-weight: 700;
            color: #92400e;
          }

          .timeline-line {
            width: 2px;
            flex: 1;
            background: #fde68a;
            margin: 4px 0;
          }

          .timeline-content {
            flex: 1;
            padding-bottom: 20px;
          }

          .timeline-item-last .timeline-content {
            padding-bottom: 0;
          }

          .timeline-item {
            position: relative;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }

          .timeline-item::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 14px;
            right: 0;
            height: 1px;
            background: #e5e7eb;
          }

          .timeline-item-last {
            padding-bottom: 0;
            margin-bottom: 0;
          }

          .timeline-item-last::after {
            display: none;
          }

          .step-card {
            padding: 0;
          }

          .timeline-step-header {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .timeline-step-name {
            font-size: 14px;
            font-weight: 700;
            color: #111827;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          }

          .timeline-operation {
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            background: #dbeafe;
            color: #1e40af;
            font-weight: 600;
          }

          .source-icon {
            vertical-align: middle;
            flex-shrink: 0;
          }

          .timeline-operation-group {
            display: inline-flex;
            align-items: center;
            border-radius: 4px;
            overflow: hidden;
            font-size: 11px;
            font-weight: 600;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            line-height: 1;
          }

          .timeline-operation-group .source-icon {
            margin: 0 -1px 0 4px;
          }

          .timeline-source {
            padding: 3px 6px 3px 2px;
            background: #f3f4f6;
            color: #6b7280;
          }

          .timeline-op-name {
            padding: 3px 6px;
            background: #dbeafe;
            color: #1e40af;
          }

          .source-card-top .source-icon {
            margin-right: 2px;
          }

          .step-description {
            color: #6b7280;
            margin: 6px 0 0 0;
            font-style: italic;
            font-size: 13px;
            line-height: 1.5;
          }

          .step-op-ref {
            font-weight: 700;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-style: normal;
            font-size: 12px;
          }

          /* Collapsible step sections */
          .step-detail {
            margin-top: 2px;
          }

          .step-detail-summary {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 3px 0;
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            cursor: pointer;
            user-select: none;
            list-style: none;
          }

          .step-detail-summary::-webkit-details-marker {
            display: none;
          }

          .step-detail-summary::before {
            content: '▶';
            font-size: 7px;
            color: #9ca3af;
            transition: transform 0.15s;
          }

          .step-detail[open] > .step-detail-summary::before {
            transform: rotate(90deg);
          }

          .step-detail-summary:hover {
            color: #374151;
          }

          .step-detail-count {
            font-size: 10px;
            font-weight: 600;
            color: #9ca3af;
          }

          .step-detail-body {
            padding: 2px 0 4px 14px;
            font-size: 13px;
            color: #4b5563;
            line-height: 1.7;
          }

          .step-row {
            padding: 2px 0;
            font-size: 13px;
            color: #4b5563;
          }

          .step-row code {
            background: #f3f4f6;
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 12px;
            color: #1e40af;
          }

          .step-grid-3 {
            display: grid;
            grid-template-columns: auto auto 1fr;
            gap: 2px 12px;
          }

          .step-grid-row {
            display: contents;
            font-size: 13px;
            color: #4b5563;
          }

          .step-grid-row code {
            background: #f3f4f6;
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 12px;
            color: #1e40af;
          }

          .step-arrow {
            color: #9ca3af;
          }

          .step-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            font-size: 12px;
          }

          .step-table th {
            background: #f9fafb;
            padding: 5px 10px;
            text-align: left;
            font-weight: 600;
            color: #6b7280;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            border-bottom: 1px solid #e5e7eb;
          }

          .step-table td {
            padding: 4px 10px;
            color: #4b5563;
            border-bottom: 1px solid #f3f4f6;
          }

          .step-table tr:last-child td {
            border-bottom: none;
          }

          .step-table code {
            background: #f3f4f6;
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 11px;
            color: #1e40af;
          }

          .arazzo-docs-view table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
          }

          .arazzo-docs-view th {
            background: #f3f4f6;
            padding: 8px 12px;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border: 1px solid #d1d5db;
          }

          .arazzo-docs-view td {
            padding: 8px 12px;
            border: 1px solid #e5e7eb;
            color: #4b5563;
          }

          .arazzo-docs-view code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.9em;
            color: #1e40af;
          }

          .arazzo-docs-view strong {
            color: #1f2937;
            font-weight: 600;
          }

          .arazzo-docs-view ul {
            margin: 8px 0;
            padding-left: 20px;
          }

          .arazzo-docs-view li {
            margin: 6px 0;
            line-height: 1.6;
          }

          /* Runtime expression styling */
          .arazzo-docs-view p, .arazzo-docs-view li {
            color: #374151;
          }

          /* Badge styling - small pills like SwaggerUI */
          .version-badge {
            display: inline-flex;
            align-items: center;
            height: 22px;
            padding: 0 8px;
            border-radius: 11px;
            font-size: 11px;
            font-weight: 600;
            border: none;
            white-space: nowrap;
            cursor: default;
            margin-top: 6px;
          }

          .spec-version {
            background: #49cc90;
            color: #fff;
          }

          .doc-version {
            background: #61affe;
            color: #fff;
          }

          .step-count-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
          }

          .operation-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            background: #dbeafe;
            color: #1e40af;
          }

          /* Action badges (END, GOTO, RETRY) */
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-left: 6px;
            vertical-align: middle;
          }

          .badge-success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #86efac;
          }

          .badge-error {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
          }

          .badge-warning {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
          }

          .badge-info {
            background: #dbeafe;
            color: #1e40af;
            border: 1px solid #bfdbfe;
          }

          .mermaid-rendered {
            display: flex;
            justify-content: center;
            margin: 16px 0;
          }

          .mermaid-rendered svg {
            max-width: 100%;
            height: auto;
          }

        `}</style>
        <article className="arazzo-docs-prose">
          {/* Header: title, version, sources */}
          <ReactMarkdown remarkPlugins={markdownPlugins} rehypePlugins={rehypePlugins}>
            {documentation.headerMarkdown}
          </ReactMarkdown>

          {/* Workflows */}
          <div className="workflows-header-row">
            <span className="sources-header" style={{ margin: 0 }}>
              Workflows
            </span>
            <button className="expand-all-btn" onClick={handleExpandAll}>
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </button>
          </div>

          {documentation.workflows.map((workflow) => {
            const stepCount = workflow.steps.length;
            const currentView = getWorkflowView(workflow.workflowId);
            const workflowMd = documentation.workflowMarkdowns.get(workflow.workflowId) || '';

            const sequenceSource = sequenceDiagrams.get(workflow.workflowId) || null;
            const flowchartSource = flowchartDiagrams.get(workflow.workflowId) || null;

            return (
              <details
                key={workflow.workflowId}
                className="workflow-details"
                onToggle={(e) => handleToggle(workflow.workflowId, e)}
              >
                <summary className="workflow-summary-bar">
                  <span className="step-count-badge">
                    {stepCount} {stepCount === 1 ? 'Step' : 'Steps'}
                  </span>
                  <span className="workflow-summary-title">{workflow.workflowId}</span>
                  {workflow.summary && (
                    <span className="workflow-summary-text">{workflow.summary}</span>
                  )}
                </summary>
                <div className="workflow-details-content">
                  <div className="workflow-view-toggle">
                    {viewModes.map((mode) => (
                      <button
                        key={mode}
                        className={`workflow-view-btn ${currentView === mode ? 'workflow-view-btn-active' : ''}`}
                        onClick={() => setWorkflowView(workflow.workflowId, mode)}
                      >
                        {viewLabels[mode]}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: currentView === 'docs' ? 'block' : 'none' }}>
                    <ReactMarkdown remarkPlugins={markdownPlugins} rehypePlugins={rehypePlugins}>
                      {workflowMd}
                    </ReactMarkdown>
                  </div>
                  {sequenceSource && expandedWorkflows.has(workflow.workflowId) && (
                    <div style={{ display: currentView === 'sequence' ? 'block' : 'none' }}>
                      <MermaidDiagram source={sequenceSource} />
                    </div>
                  )}
                  {flowchartSource && expandedWorkflows.has(workflow.workflowId) && (
                    <div style={{ display: currentView === 'flowchart' ? 'block' : 'none' }}>
                      <MermaidDiagram source={flowchartSource} />
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </article>
      </div>
    </div>
  );
};
