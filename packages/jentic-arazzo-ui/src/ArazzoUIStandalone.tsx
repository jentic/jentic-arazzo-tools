import React, { forwardRef, useState, useCallback, useRef } from 'react';

import { ArazzoUI } from './ArazzoUI';
import { JenticLogo } from './components/JenticLogo';
import { UploadIcon } from './components/UploadIcon';
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

    // ?document= query param takes precedence, #document= hash used for large inline content
    const queryParam = new URLSearchParams(globalThis.location.search).get('document');
    const hashParam = new URLSearchParams(globalThis.location.hash.slice(1)).get('document');
    const initialDocument = queryParam || hashParam || props.document;

    const [urlInput, setUrlInput] = useState(
      typeof initialDocument === 'string' && /^https?:\/\//i.test(initialDocument)
        ? initialDocument
        : '',
    );
    const [documentSource, setDocumentSource] = useState<ArazzoDocument | string>(initialDocument);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragCounter = useRef(0);

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
        const params = new URLSearchParams(globalThis.location.search);
        params.set('document', trimmed);
        const qs = params.toString();
        globalThis.history.replaceState(null, '', `?${qs}`);
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

    const loadFile = useCallback((file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          setUrlInput('');
          setDocumentSource(content);
          globalThis.history.replaceState(null, '', globalThis.location.pathname);
        }
      };
      reader.readAsText(file);
    }, []);

    const handleFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          loadFile(file);
        }
        // reset so the same file can be re-selected
        e.target.value = '';
      },
      [loadFile],
    );

    const handleDragEnter = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const types = Array.from(e.dataTransfer.types);
      if (!types.includes('Files')) return;
      dragCounter.current += 1;
      if (dragCounter.current === 1) {
        setDragging(true);
      }
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) {
        setDragging(false);
      }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current = 0;
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
          loadFile(file);
        }
      },
      [loadFile],
    );

    return (
      <div
        className={`arazzo-ui-standalone ${props.className ?? ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          position: 'relative',
          ...props.style,
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".yaml,.yml,.json,.arazzo"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
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
              width: '560px',
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
                background: '#94C83D',
                color: '#fff',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              Explore
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload Arazzo document"
              title="Upload Arazzo document"
              style={{
                padding: '6px',
                border: '1px solid #444',
                borderRadius: '6px',
                background: '#2a2a2a',
                color: '#fff',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
              }}
            >
              <UploadIcon size={16} />
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
        {dragging && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(148, 200, 61, 0.1)',
              border: '2px dashed #94C83D',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                background: '#1B1B1B',
                color: '#94C83D',
                padding: '16px 32px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              Drop Arazzo document here
            </div>
          </div>
        )}
      </div>
    );
  },
);
