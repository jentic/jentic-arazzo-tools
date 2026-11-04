import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { KeyValueRowView, RequestBodyView } from '../utils/documentation/requestBodyView';

interface RequestBodyDialogProps {
  stepId: string;
  requestBody: RequestBodyView;
  onClose: () => void;
}

const monoFont = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

const KeyValueRows: React.FC<{ rows: KeyValueRowView[] }> = ({ rows }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
    {rows.map((r, idx) => (
      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
        <code style={{ fontFamily: monoFont }}>{r.key}</code>
        <span style={{ color: '#9333ea' }}>{r.arrow}</span>
        <code style={{ fontFamily: monoFont }}>{r.value}</code>
      </div>
    ))}
  </div>
);

export const RequestBodyDialog: React.FC<RequestBodyDialogProps> = ({
  stepId,
  requestBody,
  onClose,
}) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // portal to body so the dialog escapes the react-flow viewport transform
  return createPortal(
    <div
      className="arazzo-ui nodrag nopan nowheel"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 24, 39, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Request body for ${stepId}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
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
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
            Request Body <span style={{ color: '#6b7280', fontWeight: 400 }}>· {stepId}</span>
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
              color: '#6b7280',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '16px', overflow: 'auto', fontSize: '12px', color: '#374151' }}>
          {requestBody.contentType && (
            <div style={{ marginBottom: '12px' }}>
              Content-Type:{' '}
              <code style={{ fontFamily: monoFont, color: '#1e40af' }}>
                {requestBody.contentType}
              </code>
            </div>
          )}

          {requestBody.payload?.kind === 'form' && (
            <KeyValueRows rows={requestBody.payload.fields} />
          )}

          {requestBody.payload?.kind === 'code' && (
            <pre
              style={{
                margin: '0 0 12px',
                padding: '12px',
                background: '#1f2937',
                color: '#f3f4f6',
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
                style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}
              >
                REPLACEMENTS:
              </div>
              <KeyValueRows rows={requestBody.replacements} />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
