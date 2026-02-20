import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { EndNodeData } from '../types/index';

export const EndNode: React.FC<NodeProps<EndNodeData>> = ({ data, selected }) => {
  const { workflowId, outputs } = data;
  const hasOutputs = outputs && Object.keys(outputs).length > 0;

  // Selection styles - more prominent
  const boxShadow = selected
    ? '0 0 0 3px rgba(59, 130, 246, 0.4), 0 8px 24px rgba(107, 114, 128, 0.3)'
    : '0 2px 8px rgba(0,0,0,0.15)';

  return (
    <div
      className={`end-node ${selected ? 'end-node--selected' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        border: `3px solid ${selected ? '#3b82f6' : '#4b5563'}`,
        borderRadius: '12px',
        width: '420px',
        color: '#fff',
        boxShadow,
        transition: 'all 0.15s ease-in-out',
        transform: selected ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#fff' }} />

      {/* Header */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '20px' }}>■</span>
        <span style={{ fontWeight: 700, fontSize: '16px' }}>END</span>
      </div>

      {/* Workflow ID */}
      <div
        style={{
          padding: '0 16px 12px',
          fontSize: '12px',
          textAlign: 'center',
          opacity: 0.9,
        }}
      >
        {workflowId}
      </div>

      {/* Outputs */}
      {hasOutputs && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.3)',
            fontSize: '11px',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '6px', opacity: 0.9 }}>OUTPUTS:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {Object.keys(outputs || {})
              .slice(0, 3)
              .map((key) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>•</span>
                  <span>{key}</span>
                </div>
              ))}
            {Object.keys(outputs || {}).length > 3 && (
              <div style={{ fontSize: '10px', opacity: 0.8, fontStyle: 'italic' }}>
                +{Object.keys(outputs || {}).length - 3} more...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
