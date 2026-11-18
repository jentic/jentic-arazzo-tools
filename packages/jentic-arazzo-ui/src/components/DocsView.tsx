import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';
import { useArazzoViewer } from '../context/ArazzoViewerContext';
import { palette } from '../styles/palette';
import {
  generateDocumentation,
  generateMermaidSequence,
  generateMermaidFlowchart,
} from '../utils/documentation/index';
import { worstSeverity } from '../utils/documentation/inlineDiagnostics';
import { ErrorBoundary, RenderErrorNotice } from './ErrorBoundary';
import type { DiagnosticSeverityName, ValidationState } from '../utils/validation';

export interface DocsViewProps {
  diagramType?: string;
  onDiagramTypeChange?: (type: string) => void;
  validation?: ValidationState;
}

const severityLabels: Record<DiagnosticSeverityName, [singular: string, plural: string]> = {
  error: ['error', 'errors'],
  warning: ['warning', 'warnings'],
  info: ['info', 'info'],
  hint: ['hint', 'hints'],
};

interface ValidationSectionProps {
  validation: ValidationState;
  showInlineNotes: boolean;
  onShowInlineNotesChange: (show: boolean) => void;
}

const ValidationSection: React.FC<ValidationSectionProps> = ({
  validation,
  showInlineNotes,
  onShowInlineNotesChange,
}) => {
  // only errors and warnings are shown inline, so the switch is pointless without them
  const hasInlineNotes =
    validation.status === 'done' &&
    validation.diagnostics.some((d) => d.severity === 'error' || d.severity === 'warning');
  let summary: React.ReactNode = null;
  let body: React.ReactNode;

  if (validation.status === 'loading') {
    body = <div className="validation-empty">Validating document…</div>;
  } else if (validation.status === 'error') {
    body = (
      <div className="validation-empty validation-failed">
        Validation could not be run: {validation.message}
      </div>
    );
  } else if (validation.diagnostics.length === 0) {
    body = <div className="validation-empty validation-ok">✓ No issues found</div>;
  } else {
    const counts = validation.diagnostics.reduce<Partial<Record<DiagnosticSeverityName, number>>>(
      (acc, d) => ({ ...acc, [d.severity]: (acc[d.severity] ?? 0) + 1 }),
      {},
    );
    summary = (Object.keys(severityLabels) as DiagnosticSeverityName[])
      .filter((severity) => counts[severity])
      .map((severity) => {
        const count = counts[severity]!;
        const [singular, plural] = severityLabels[severity];
        return (
          <span key={severity} className={`validation-count validation-count-${severity}`}>
            {count} {count === 1 ? singular : plural}
          </span>
        );
      });
    body = (
      <ul className="validation-list">
        {validation.diagnostics.map((d, i) => (
          <li key={i} className="validation-item">
            <span className={`validation-severity validation-severity-${d.severity}`}>
              {d.severity}
            </span>
            {validation.hasSourcePositions && (
              <span className="validation-location">
                {d.line}:{d.column}
              </span>
            )}
            <span className="validation-message">{d.message}</span>
            {d.code && <span className="validation-code">{d.code}</span>}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="validation-section" data-validation-status={validation.status}>
      <div className="workflows-header-row">
        <span className="validation-title">
          <span className="sources-header" style={{ margin: 0 }}>
            Validation
          </span>
          {hasInlineNotes && (
            <button
              type="button"
              role="switch"
              aria-checked={showInlineNotes}
              className="validation-inline-switch"
              title={
                showInlineNotes
                  ? 'Hide validation notes in the workflows above'
                  : 'Show validation notes in the workflows above'
              }
              onClick={() => onShowInlineNotesChange(!showInlineNotes)}
            >
              <span className="validation-inline-switch-track" aria-hidden="true">
                <span className="validation-inline-switch-thumb" />
              </span>
              Inline notes
            </button>
          )}
        </span>
        {summary && <span className="validation-summary">{summary}</span>}
      </div>
      <div className="validation-card">
        {validation.status === 'done' && validation.notice && (
          <div className="validation-notice">{validation.notice}</div>
        )}
        {body}
      </div>
    </section>
  );
};

// invalid documents can hold non-string ids; show them as written
const displayValue = (value: unknown): string => {
  if (typeof value === 'string') return `"${value}"`;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

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

export const DocsView: React.FC<DocsViewProps> = ({ validation }) => {
  const { document, documentURL, selectedNodeId, nodes, activeWorkflowId } = useArazzoViewer();
  const mermaidInitialized = useRef(false);
  const docsContainerRef = useRef<HTMLDivElement>(null);
  // by workflow index, as ids can be missing or repeated in invalid documents
  const [workflowViews, setWorkflowViews] = useState<Record<number, WorkflowViewMode>>({});
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());

  const getWorkflowView = useCallback(
    (workflowIndex: number): WorkflowViewMode => workflowViews[workflowIndex] || 'docs',
    [workflowViews],
  );

  const setWorkflowView = useCallback(
    (workflowIndex: number, view: WorkflowViewMode) =>
      setWorkflowViews((prev) => ({ ...prev, [workflowIndex]: view })),
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
        theme: 'base',
        darkMode: false,
        themeVariables: {
          background: palette.card,
          fontFamily: "'Nunito Sans', sans-serif",
          primaryColor: palette.card,
          primaryTextColor: palette.fg,
          primaryBorderColor: palette.primary,
          secondaryColor: palette.bgSecondary,
          tertiaryColor: palette.bgSecondary,
          lineColor: palette.subtleFg,
          textColor: palette.fgLighter,
          mainBkg: palette.card,
          nodeBorder: palette.primary,
          clusterBkg: palette.bgSecondary,
          edgeLabelBackground: palette.bgSecondary,
          actorBkg: palette.card,
          actorBorder: palette.primary,
          actorTextColor: palette.fg,
          actorLineColor: palette.borderHover,
          signalColor: palette.fgLighter,
          signalTextColor: palette.fgLighter,
          labelBoxBkgColor: palette.bgSecondary,
          labelBoxBorderColor: palette.border,
          labelTextColor: palette.fg,
          loopTextColor: palette.fgLighter,
          noteBkgColor: palette.bgSecondary,
          noteBorderColor: palette.border,
          noteTextColor: palette.fgLighter,
          activationBkgColor: palette.bgSecondary,
          activationBorderColor: palette.primary,
          sequenceNumberColor: palette.onAccent,
        },
        securityLevel: 'loose',
        flowchart: { useMaxWidth: true, htmlLabels: true },
      });
      mermaidInitialized.current = true;
    }
  }, []);

  // Scroll to step when a diagram node is selected
  useEffect(() => {
    if (!selectedNodeId || !docsContainerRef.current) return;

    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node || (node.data.type !== 'step' && node.data.type !== 'workflowRef')) return;

    const stepId = node.data.step.stepId;
    const workflowId =
      node.data.type === 'step' ? node.data.workflowId : node.data.targetWorkflowId;

    // expand the workflow <details> if closed
    const details = docsContainerRef.current.querySelector(
      `details[data-workflow-id="${workflowId}"]`,
    ) as HTMLDetailsElement | null;
    if (details && !details.open) {
      details.open = true;
      setExpandedWorkflows((prev) => new Set(prev).add(workflowId));
    }

    // scroll to the step after DOM updates
    requestAnimationFrame(() => {
      const stepEl = docsContainerRef.current?.querySelector(`[data-step-id="${stepId}"]`);
      stepEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [selectedNodeId, nodes]);

  // Scroll to workflow when switching workflow tabs in diagram (skip initial value)
  const prevActiveWorkflowId = useRef(activeWorkflowId);
  useEffect(() => {
    if (prevActiveWorkflowId.current === activeWorkflowId) return;
    prevActiveWorkflowId.current = activeWorkflowId;

    if (!activeWorkflowId || !docsContainerRef.current) return;

    const details = docsContainerRef.current.querySelector(
      `details[data-workflow-id="${activeWorkflowId}"]`,
    ) as HTMLDetailsElement | null;
    if (!details) return;

    if (!details.open) {
      details.open = true;
      setExpandedWorkflows((prev) => new Set(prev).add(activeWorkflowId));
    }

    requestAnimationFrame(() => {
      details.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [activeWorkflowId]);

  // Generate documentation (memoized)
  const [showInlineNotes, setShowInlineNotes] = useState(true);
  const diagnostics =
    showInlineNotes && validation?.status === 'done' ? validation.diagnostics : undefined;

  const documentation = useMemo(() => {
    if (!document) return null;
    return generateDocumentation(document, {
      includeMetadata: true,
      includeDiagrams: false,
      documentURL,
      diagnostics,
    });
  }, [document, documentURL, diagnostics]);

  // Pre-generate all diagrams (memoized)
  // by workflow index, like the generated documentation
  const sequenceDiagrams = useMemo(() => {
    if (!document) return [];
    return document.workflows.map((workflow) => {
      // an invalid workflow just has no diagram; its docs show what went wrong
      try {
        return generateMermaidSequence(workflow, document);
      } catch {
        return null;
      }
    });
  }, [document]);

  const flowchartDiagrams = useMemo(() => {
    if (!document) return [];
    return document.workflows.map((workflow) => {
      try {
        return generateMermaidFlowchart(workflow);
      } catch {
        // as for the sequence diagram
        return null;
      }
    });
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
        <div style={{ padding: '24px', color: 'var(--arazzo-muted-fg)' }}>No workflow loaded</div>
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
          background: 'var(--arazzo-bg)',
        }}
      >
        <style>{`
          .workflow-details {
            background: var(--arazzo-card);
            border-radius: 8px;
            margin-bottom: 12px;
            box-shadow: var(--arazzo-shadow);
            border: 1px solid var(--arazzo-border);
            overflow: hidden;
          }

          .workflow-details[open] {
            border-color: var(--arazzo-primary);
          }

          .workflow-summary-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 20px;
            cursor: pointer;
            user-select: none;
            list-style: none;
            background: var(--arazzo-primary-bg);
            transition: background 0.15s;
          }

          .workflow-summary-bar::-webkit-details-marker {
            display: none;
          }

          .workflow-summary-bar::before {
            content: '▶';
            font-size: 10px;
            color: var(--arazzo-primary);
            transition: transform 0.15s;
            flex-shrink: 0;
          }

          .workflow-details[open] > .workflow-summary-bar::before {
            transform: rotate(90deg);
          }

          .workflow-summary-bar:hover {
            background: var(--arazzo-bg-secondary);
          }

          .workflow-summary-title {
            font-size: 15px;
            font-weight: 700;
            color: var(--arazzo-fg);
            font-family: var(--arazzo-font-mono);
          }

          .workflow-summary-text {
            font-size: 13px;
            color: var(--arazzo-muted-fg);
            flex: 1;
          }

          .workflow-details-content {
            padding: 4px 20px 20px;
            border-top: 1px solid var(--arazzo-border);
          }

          .workflow-view-toggle {
            display: flex;
            gap: 0;
            border-bottom: 1px solid var(--arazzo-border);
            margin-bottom: 16px;
            margin-top: 8px;
          }

          .workflow-view-btn {
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 500;
            border: none;
            background: none;
            color: var(--arazzo-muted-fg);
            cursor: pointer;
            transition: all 0.15s;
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
          }

          .workflow-view-btn:hover {
            color: var(--arazzo-fg-lighter);
          }

          .workflow-view-btn-active {
            color: var(--arazzo-fg);
            font-weight: 600;
            border-bottom-color: var(--arazzo-primary);
          }

          .workflow-description {
            color: var(--arazzo-fg-lighter);
            margin: 16px 0;
            line-height: 1.6;
          }

          .doc-section {
            background: var(--arazzo-bg-secondary);
            border: 1px solid var(--arazzo-border);
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
          }

          .sources-section {
            margin: 40px 0;
          }

          .sources-header {
            font-family: var(--arazzo-font-heading);
            font-size: 13px;
            font-weight: 600;
            color: var(--arazzo-muted-fg);
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
            color: var(--arazzo-muted-fg);
            background: none;
            border: 1px solid var(--arazzo-border);
            border-radius: 4px;
            padding: 3px 10px;
            cursor: pointer;
            transition: all 0.15s;
          }

          .expand-all-btn:hover {
            color: var(--arazzo-fg-lighter);
            border-color: var(--arazzo-border-hover);
            background: var(--arazzo-bg-secondary);
          }

          .sources-grid {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }

          .source-card {
            flex: 1;
            min-width: 240px;
            background: var(--arazzo-card);
            border: 1px solid var(--arazzo-border);
            border-radius: 8px;
            padding: 14px 16px;
            transition: border-color 0.15s, box-shadow 0.15s;
          }

          .source-card:hover {
            border-color: var(--arazzo-primary);
            box-shadow: 0 2px 8px var(--arazzo-ring-glow);
          }

          .source-card-top {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
          }

          .source-type-badge {
            font-family: var(--arazzo-font-heading);
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          .source-type-openapi {
            background: var(--arazzo-primary);
            color: var(--arazzo-on-accent);
          }

          .source-type-arazzo {
            background: var(--arazzo-primary);
            color: var(--arazzo-on-accent);
          }

          .source-name {
            font-size: 15px;
            font-weight: 600;
            color: var(--arazzo-fg);
          }

          .source-url {
            display: block;
            font-size: 12px;
            color: var(--arazzo-muted-fg);
            text-decoration: none;
            word-break: break-all;
          }

          .source-url:hover {
            color: var(--arazzo-primary);
            text-decoration: underline;
          }

          .doc-section h3 {
            margin-top: 0;
            color: var(--arazzo-fg);
            font-size: 1.1rem;
            font-weight: 600;
            border-bottom: 2px solid var(--arazzo-border);
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
            background: var(--arazzo-primary-bg);
            border: 1px solid var(--arazzo-primary);
            flex-shrink: 0;
            font-size: 11px;
            font-weight: 700;
            color: var(--arazzo-primary);
          }

          .timeline-line {
            width: 2px;
            flex: 1;
            background: var(--arazzo-primary);
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
            background: var(--arazzo-border);
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
            color: var(--arazzo-fg);
            font-family: var(--arazzo-font-mono);
          }

          .timeline-operation {
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            background: var(--arazzo-primary-bg);
            color: var(--arazzo-primary);
            font-weight: 600;
          }

          .source-card-top .source-icon {
            margin-right: 2px;
          }

          .step-description {
            color: var(--arazzo-muted-fg);
            margin: 6px 0 0 0;
            font-style: italic;
            font-size: 13px;
            line-height: 1.5;
          }

          .step-op-ref {
            font-weight: 700;
            font-family: var(--arazzo-font-mono);
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
            color: var(--arazzo-muted-fg);
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
            color: var(--arazzo-subtle-fg);
            transition: transform 0.15s;
          }

          .step-detail[open] > .step-detail-summary::before {
            transform: rotate(90deg);
          }

          .step-detail-summary:hover {
            color: var(--arazzo-fg-lighter);
          }

          .step-detail-count {
            font-size: 10px;
            font-weight: 600;
            color: var(--arazzo-muted-fg);
          }

          /* inline validation notes */
          .step-detail-issues {
            font-size: 10px;
            font-weight: 700;
            padding: 0 6px;
            border-radius: 8px;
            line-height: 16px;
          }

          .step-detail-issues-error {
            background: var(--arazzo-danger-bg);
            color: var(--arazzo-danger);
          }

          .step-detail-issues-warning {
            background: var(--arazzo-warning-bg);
            color: var(--arazzo-warning);
          }

          .step-detail-issues-info, .step-detail-issues-hint {
            background: var(--arazzo-bg-secondary);
            color: var(--arazzo-fg-lighter);
          }

          .workflow-issues {
            margin-left: auto;
            font-size: 11px;
            line-height: 20px;
            padding: 0 8px;
            border-radius: 10px;
          }

          .workflow-diagnostics,
          .step-card > .step-diagnostics {
            margin-top: 8px;
          }

          .workflow-diagnostics:empty {
            display: none;
          }

          .step-diagnostics {
            grid-column: 1 / -1;
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin: 2px 0 6px;
          }

          .step-diagnostic {
            display: flex;
            align-items: baseline;
            gap: 8px;
            padding: 3px 8px;
            border-left: 2px solid;
            border-radius: 0 4px 4px 0;
            font-size: 12px;
            line-height: 1.5;
          }

          .step-diagnostic-error {
            background: var(--arazzo-danger-bg);
            border-color: var(--arazzo-danger);
            color: var(--arazzo-danger);
          }

          .step-diagnostic-warning {
            background: var(--arazzo-warning-bg);
            border-color: var(--arazzo-accent-orange);
            color: var(--arazzo-warning);
          }

          .step-diagnostic-info, .step-diagnostic-hint {
            background: var(--arazzo-bg-secondary);
            border-color: var(--arazzo-border-hover);
            color: var(--arazzo-fg-lighter);
          }

          .step-diagnostic-severity {
            flex-shrink: 0;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .step-diagnostic-message {
            word-break: break-word;
          }

          .step-detail-body {
            padding: 2px 0 4px 14px;
            font-size: 13px;
            color: var(--arazzo-fg-lighter);
            line-height: 1.7;
          }

          .step-row {
            padding: 2px 0;
            font-size: 13px;
            color: var(--arazzo-fg-lighter);
          }

          .step-row code {
            background: var(--arazzo-bg-secondary);
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 12px;
          }

          .step-grid-3 {
            display: grid;
            grid-template-columns: auto auto 1fr;
            gap: 2px 12px;
          }

          .step-grid-row {
            display: contents;
            font-size: 13px;
            color: var(--arazzo-fg-lighter);
          }

          .step-grid-row code {
            background: var(--arazzo-bg-secondary);
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 12px;
          }

          .step-arrow {
            color: var(--arazzo-subtle-fg);
          }

          .step-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            font-size: 12px;
          }

          .step-table th {
            background: var(--arazzo-bg-secondary);
            padding: 5px 10px;
            text-align: left;
            font-weight: 600;
            color: var(--arazzo-muted-fg);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            border-bottom: 1px solid var(--arazzo-border);
          }

          .step-table td {
            padding: 4px 10px;
            color: var(--arazzo-fg-lighter);
            border-bottom: 1px solid var(--arazzo-border);
          }

          .step-table tr:last-child td {
            border-bottom: none;
          }

          .step-table.request-body-table td {
            border-bottom: 1px solid var(--arazzo-border);
          }

          .step-table.request-body-table tr:last-child td {
            border-bottom: 1px solid var(--arazzo-border);
          }

          .step-table code {
            background: var(--arazzo-bg-secondary);
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 11px;
          }

          .arazzo-docs-view table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
          }

          .arazzo-docs-view th {
            background: var(--arazzo-bg-secondary);
            padding: 8px 12px;
            text-align: left;
            font-weight: 600;
            color: var(--arazzo-fg-lighter);
            border: 1px solid var(--arazzo-border);
          }

          .arazzo-docs-view td {
            padding: 8px 12px;
            border: 1px solid var(--arazzo-border);
            color: var(--arazzo-fg-lighter);
          }

          .arazzo-docs-view code {
            background: var(--arazzo-bg-secondary);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.9em;
            color: var(--arazzo-fg);
          }

          /* names (parameters, outputs, actions, steps) use the base color above;
             values and runtime expressions use teal. Second-column table cells
             hold values: workflow outputs and request body fields */
          .arazzo-docs-view code.expr,
          .arazzo-docs-view td + td > code {
            color: var(--arazzo-expression-fg);
          }

          .arazzo-docs-view code.content-type {
            color: var(--arazzo-primary);
          }

          .arazzo-docs-view strong {
            color: var(--arazzo-fg);
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
            color: var(--arazzo-fg-lighter);
          }

          /* mermaid wraps node labels in <p> and colors the wrapper, so let them inherit */
          .arazzo-docs-view .mermaid-rendered p {
            color: inherit;
          }

          /* Badge styling - small pills like SwaggerUI */
          .version-badge {
            font-family: var(--arazzo-font-heading);
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
            background: var(--arazzo-primary);
            color: var(--arazzo-on-accent);
          }

          .doc-version {
            background: var(--arazzo-bg-secondary);
            color: var(--arazzo-fg);
            border: 1px solid var(--arazzo-border);
          }

          .step-count-badge {
            font-family: var(--arazzo-font-heading);
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            background: var(--arazzo-primary);
            color: var(--arazzo-on-accent);
            border: 1px solid var(--arazzo-primary);
          }

          .operation-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            background: var(--arazzo-primary-bg);
            color: var(--arazzo-primary);
          }

          /* Action badges (END, GOTO, RETRY) */
          .badge {
            font-family: var(--arazzo-font-heading);
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
            background: var(--arazzo-success-bg);
            color: var(--arazzo-success);
            border: 1px solid var(--arazzo-success-border);
          }

          .badge-error {
            background: var(--arazzo-danger-bg);
            color: var(--arazzo-danger);
            border: 1px solid var(--arazzo-danger-border);
          }

          .badge-warning {
            background: var(--arazzo-warning-bg);
            color: var(--arazzo-warning);
            border: 1px solid var(--arazzo-warning-border);
          }

          .badge-info {
            background: var(--arazzo-info-bg);
            color: var(--arazzo-info);
            border: 1px solid var(--arazzo-info-border);
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

          /* validation section */
          .validation-section {
            margin-bottom: 24px;
          }

          .validation-summary {
            display: flex;
            gap: 6px;
          }

          .validation-title {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .validation-inline-switch {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 500;
            color: var(--arazzo-muted-fg);
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
          }

          .validation-inline-switch:hover {
            color: var(--arazzo-fg-lighter);
          }

          .validation-inline-switch:focus-visible {
            outline: 3px solid var(--arazzo-primary);
            outline-offset: 2px;
            border-radius: 4px;
          }

          .validation-inline-switch-track {
            position: relative;
            width: 28px;
            height: 16px;
            border-radius: 8px;
            background: var(--arazzo-input-border);
            transition: background 0.15s;
          }

          .validation-inline-switch-thumb {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--arazzo-card);
            box-shadow: var(--arazzo-shadow);
            transition: transform 0.15s;
          }

          .validation-inline-switch[aria-checked='true'] .validation-inline-switch-track {
            background: var(--arazzo-primary);
          }

          .validation-inline-switch[aria-checked='true'] .validation-inline-switch-thumb {
            transform: translateX(12px);
          }

          .validation-count {
            font-size: 11px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 10px;
          }

          .validation-card {
            background: var(--arazzo-card);
            border: 1px solid var(--arazzo-border);
            border-radius: 8px;
            box-shadow: var(--arazzo-shadow);
            overflow: hidden;
          }

          .validation-empty {
            padding: 14px 20px;
            font-size: 13px;
            color: var(--arazzo-muted-fg);
          }

          .validation-ok {
            color: var(--arazzo-success);
            font-weight: 600;
          }

          .validation-failed {
            color: var(--arazzo-danger);
          }

          .validation-notice {
            padding: 10px 20px;
            font-size: 12px;
            color: var(--arazzo-warning);
            background: var(--arazzo-warning-bg);
            border-bottom: 1px solid var(--arazzo-warning-border);
          }

          .arazzo-docs-view ul.validation-list {
            list-style: none;
            margin: 0;
            padding: 0;
          }

          .arazzo-docs-view li.validation-item {
            display: flex;
            align-items: baseline;
            gap: 10px;
            margin: 0;
            padding: 10px 20px;
            border-bottom: 1px solid var(--arazzo-border);
            font-size: 13px;
            line-height: 1.5;
          }

          .arazzo-docs-view li.validation-item:last-child {
            border-bottom: none;
          }

          .validation-severity {
            flex-shrink: 0;
            box-sizing: border-box;
            width: 70px;
            text-align: center;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .validation-severity-error, .validation-count-error {
            background: var(--arazzo-danger-bg);
            color: var(--arazzo-danger);
          }

          .validation-severity-warning, .validation-count-warning {
            background: var(--arazzo-warning-bg);
            color: var(--arazzo-warning);
          }

          .validation-severity-info, .validation-count-info,
          .validation-severity-hint, .validation-count-hint {
            background: var(--arazzo-bg-secondary);
            color: var(--arazzo-fg-lighter);
          }

          .validation-location {
            flex-shrink: 0;
            min-width: 48px;
            font-size: 12px;
            color: var(--arazzo-muted-fg);
            font-family: var(--arazzo-font-mono);
          }

          .validation-message {
            flex: 1;
            color: var(--arazzo-fg-lighter);
            word-break: break-word;
          }

          .validation-code {
            flex-shrink: 0;
            font-size: 11px;
            color: var(--arazzo-muted-fg);
            font-family: var(--arazzo-font-mono);
          }

        `}</style>
        <article className="arazzo-docs-prose">
          {/* Header: title, version, sources */}
          <ErrorBoundary label="The document header" resetKey={document}>
            {documentation.headerError !== undefined ? (
              <RenderErrorNotice label="The document header" message={documentation.headerError} />
            ) : (
              <ReactMarkdown remarkPlugins={markdownPlugins} rehypePlugins={rehypePlugins}>
                {documentation.headerMarkdown}
              </ReactMarkdown>
            )}
          </ErrorBoundary>

          {/* Workflows */}
          <div className="workflows-header-row">
            <span className="sources-header" style={{ margin: 0 }}>
              Workflows
            </span>
            <button className="expand-all-btn" onClick={handleExpandAll}>
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </button>
          </div>

          {documentation.workflows.map((workflow, workflowIndex) => {
            const stepCount = workflow.steps.length;
            const currentView = getWorkflowView(workflowIndex);
            const workflowMd = documentation.workflowMarkdowns[workflowIndex] || '';
            const workflowError = documentation.workflowErrors[workflowIndex];
            const workflowNotes = documentation.workflowNotes[workflowIndex] ?? [];

            const sequenceSource = sequenceDiagrams[workflowIndex] || null;
            const flowchartSource = flowchartDiagrams[workflowIndex] || null;

            return (
              <ErrorBoundary
                // index keys: ids can be missing or repeated in invalid documents
                key={workflowIndex}
                label={`Workflow ${displayValue(workflow.workflowId)}`}
                resetKey={document}
              >
                <details
                  className="workflow-details"
                  data-workflow-id={workflow.workflowId}
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
                    {workflowNotes.length > 0 && (
                      <span
                        className={`step-detail-issues workflow-issues step-detail-issues-${worstSeverity(workflowNotes)}`}
                        title={`${workflowNotes.length} validation ${workflowNotes.length === 1 ? 'issue' : 'issues'}`}
                      >
                        ⚠ {workflowNotes.length}
                      </span>
                    )}
                  </summary>
                  <div className="workflow-details-content">
                    <div className="workflow-view-toggle">
                      {viewModes.map((mode) => (
                        <button
                          key={mode}
                          className={`workflow-view-btn ${currentView === mode ? 'workflow-view-btn-active' : ''}`}
                          onClick={() => setWorkflowView(workflowIndex, mode)}
                        >
                          {viewLabels[mode]}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: currentView === 'docs' ? 'block' : 'none' }}>
                      {workflowError !== undefined ? (
                        <RenderErrorNotice label="This workflow" message={workflowError} />
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={markdownPlugins}
                          rehypePlugins={rehypePlugins}
                        >
                          {workflowMd}
                        </ReactMarkdown>
                      )}
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
              </ErrorBoundary>
            );
          })}

          {validation && (
            <ErrorBoundary label="The Validation section" resetKey={validation}>
              <ValidationSection
                validation={validation}
                showInlineNotes={showInlineNotes}
                onShowInlineNotesChange={setShowInlineNotes}
              />
            </ErrorBoundary>
          )}
        </article>
      </div>
    </div>
  );
};
