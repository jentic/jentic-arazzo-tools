import React, { forwardRef, useState, useCallback } from 'react';

import { ArazzoUI } from './ArazzoUI';
import { JenticLogo } from './components/JenticLogo';
import { ViewModeControl } from './components/ViewModeControl';
import type { ArazzoUIProps, ArazzoUIRef, ViewerMode } from './types/index';
import type { ArazzoDocument } from './types/arazzo';

import './styles/index.css';

export type {
  ArazzoUIProps,
  ArazzoUIRef,
  ViewerMode,
  DiagramType,
  ArazzoNode,
  ArazzoNodeData,
  StepNodeData,
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

/** @public */
export type ArazzoUIStandaloneProps = Omit<ArazzoUIProps, 'view'> & {
  initialView?: ViewerMode;
};

/**
 * ArazzoUIStandalone - Self-contained Arazzo viewer with built-in header
 *
 * Includes Jentic logo, URL input for loading documents, and view mode toggle.
 * Use this when you want a complete, ready-to-use viewer widget.
 * For custom layouts without the header, use ArazzoUI directly.
 *
 * @public
 */
export const ArazzoUIStandalone = forwardRef<ArazzoUIRef, ArazzoUIStandaloneProps>(
  function ArazzoUIStandalone(props, ref) {
    const { initialView = 'docs', onViewChange, ...rest } = props;
    const [view, setView] = useState<ViewerMode>(initialView);
    const [urlInput, setUrlInput] = useState('');
    const [documentSource, setDocumentSource] = useState<ArazzoDocument | string>(props.document);

    const handleViewChange = useCallback(
      (v: ViewerMode) => {
        setView(v);
        onViewChange?.(v);
      },
      [onViewChange],
    );

    const handleExplore = useCallback(() => {
      const trimmed = urlInput.trim();
      if (trimmed) {
        setDocumentSource(trimmed);
      }
    }, [urlInput]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          handleExplore();
        }
      },
      [handleExplore],
    );

    return (
      <div
        className={`arazzo-ui-standalone ${props.className ?? ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          ...props.style,
        }}
      >
        <div
          className="arazzo-ui-toolbar"
          style={{
            position: 'relative',
            height: '60px',
            padding: '0 16px',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1B1B1B',
          }}
        >
          <a
            href="https://jentic.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Supported by Jentic"
            style={{ position: 'absolute', left: '16px' }}
          >
            <JenticLogo style={{ height: '36px' }} />
          </a>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '520px',
            }}
          >
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter Arazzo document URL..."
              style={{
                flex: 1,
                padding: '6px 12px',
                border: '1px solid #444',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
                background: '#2a2a2a',
                color: '#fff',
              }}
            />
            <button
              onClick={handleExplore}
              style={{
                padding: '6px 16px',
                border: 'none',
                borderRadius: '6px',
                background: '#61affe',
                color: '#fff',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              Explore
            </button>
          </div>
          <div style={{ position: 'absolute', right: '16px' }}>
            <ViewModeControl value={view} onChange={handleViewChange} />
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ArazzoUI
            ref={ref}
            {...rest}
            document={documentSource}
            view={view}
            onViewChange={handleViewChange}
            className={undefined}
            style={undefined}
          />
        </div>
      </div>
    );
  },
);
