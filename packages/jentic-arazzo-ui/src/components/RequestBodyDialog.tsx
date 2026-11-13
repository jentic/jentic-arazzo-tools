import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { KeyValueRowView, RequestBodyView } from '../utils/documentation/requestBodyView';

interface RequestBodyDialogProps {
  stepId: string;
  requestBody: RequestBodyView;
  onClose: () => void;
}

const monoFont = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

const cellStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid var(--arazzo-border)',
  textAlign: 'left',
  verticalAlign: 'top',
};

const KeyValueTable: React.FC<{ keyHeader: string; rows: KeyValueRowView[] }> = ({
  keyHeader,
  rows,
}) => (
  <table
    style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '12px' }}
  >
    <thead>
      <tr
        style={{
          background: 'var(--arazzo-bg-secondary)',
          color: 'var(--arazzo-muted-fg)',
          fontSize: '11px',
        }}
      >
        <th style={{ ...cellStyle, fontWeight: 600 }}>{keyHeader}</th>
        <th style={{ ...cellStyle, fontWeight: 600 }}>Value</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((f, idx) => (
        <tr key={idx}>
          <td style={cellStyle}>
            <code style={{ fontFamily: monoFont }}>{f.key}</code>
          </td>
          <td style={cellStyle}>
            <code style={{ fontFamily: monoFont }}>{f.value}</code>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const RequestBodyDialog: React.FC<RequestBodyDialogProps> = ({
  stepId,
  requestBody,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // native modal dialog traps focus, makes the background inert and handles escape
  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement as HTMLElement | null;
    if (dialog && !dialog.open) dialog.showModal();
    // the dialog is unmounted rather than closed, so restore focus explicitly
    return () => opener?.focus?.();
  }, []);

  // portal to body so the dialog escapes the react-flow viewport transform
  return createPortal(
    <dialog
      ref={dialogRef}
      className="arazzo-ui nodrag nopan nowheel"
      aria-label={`Request body for ${stepId}`}
      onClose={onClose}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        maxWidth: 'none',
        maxHeight: 'none',
        margin: 0,
        padding: 0,
        border: 'none',
        background: 'rgb(14 26 29 / 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--arazzo-card)',
          borderRadius: '8px',
          width: 'min(640px, 90vw)',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--arazzo-border)',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--arazzo-fg)' }}>
            Request Body{' '}
            <span style={{ color: 'var(--arazzo-muted-fg)', fontWeight: 400 }}>· {stepId}</span>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '18px',
              cursor: 'pointer',
              color: 'var(--arazzo-muted-fg)',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: '16px',
            overflow: 'auto',
            fontSize: '12px',
            color: 'var(--arazzo-fg-lighter)',
          }}
        >
          {requestBody.contentType && (
            <div style={{ marginBottom: '12px' }}>
              Content-Type:{' '}
              <code style={{ fontFamily: monoFont, color: 'var(--arazzo-info)' }}>
                {requestBody.contentType}
              </code>
            </div>
          )}

          {requestBody.payload?.kind === 'form' && (
            <KeyValueTable keyHeader="Field" rows={requestBody.payload.fields} />
          )}

          {requestBody.payload?.kind === 'code' && (
            <pre
              style={{
                margin: '0 0 12px',
                padding: '12px',
                background: 'var(--arazzo-bg)',
                color: 'var(--arazzo-fg-lighter)',
                borderRadius: '6px',
                overflow: 'auto',
                fontFamily: monoFont,
                fontSize: '12px',
              }}
            >
              <code
                className={
                  requestBody.payload.language && `language-${requestBody.payload.language}`
                }
              >
                {requestBody.payload.text}
              </code>
            </pre>
          )}

          {requestBody.replacements.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--arazzo-muted-fg)',
                  marginBottom: '6px',
                }}
              >
                REPLACEMENTS:
              </div>
              <KeyValueTable keyHeader="Target" rows={requestBody.replacements} />
            </div>
          )}
        </div>
      </div>
    </dialog>,
    document.body,
  );
};
