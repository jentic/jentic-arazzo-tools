import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StartNodeData } from '../types/index';

export const StartNode: React.FC<NodeProps<StartNodeData>> = ({ data, selected }) => {
  const { workflowId, inputs, description } = data;

  let hasInputs = false;
  let inputKeys: string[] = [];

  try {
    if (inputs && inputs.properties && typeof inputs.properties === 'object') {
      inputKeys = Object.keys(inputs.properties);
      hasInputs = inputKeys.length > 0;
    }
  } catch (error) {
    console.error('[StartNode] Error processing inputs:', error, inputs);
    hasInputs = false;
    inputKeys = [];
  }

  // Selection styles - more prominent
  const boxShadow = selected
    ? '0 0 0 3px rgba(59, 130, 246, 0.4), 0 8px 24px rgba(16, 185, 129, 0.3)'
    : '0 2px 8px rgba(0,0,0,0.15)';

  return (
    <div
      className={`start-node ${selected ? 'start-node--selected' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        border: `3px solid ${selected ? '#3b82f6' : '#059669'}`,
        borderRadius: '12px',
        width: '420px',
        color: '#fff',
        boxShadow,
        transition: 'all 0.15s ease-in-out',
        transform: selected ? 'scale(1.03)' : 'scale(1)',
      }}
    >
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
        <span style={{ fontSize: '20px' }}>▶</span>
        <span style={{ fontWeight: 700, fontSize: '16px' }}>START</span>
      </div>

      {/* Workflow ID */}
      <div
        style={{
          padding: '0 16px 12px',
          fontSize: '12px',
          textAlign: 'center',
          opacity: 0.9,
          fontWeight: 600,
        }}
      >
        {workflowId}
      </div>

      {/* Description */}
      {description && (
        <div
          style={{
            padding: '0 16px 12px',
            fontSize: '11px',
            textAlign: 'center',
            opacity: 0.85,
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 5,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </div>
      )}

      {/* Inputs */}
      {hasInputs && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.3)',
            fontSize: '11px',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '6px', opacity: 0.9 }}>INPUTS:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {inputKeys.slice(0, 3).map((key) => {
              const propSchema = inputs?.properties?.[key];
              const isRequired = inputs?.required?.includes(key);
              let typeDisplay = propSchema?.type || 'any';

              // Show enum for string types with enum defined
              if (typeDisplay === 'string' && propSchema?.enum && Array.isArray(propSchema.enum)) {
                typeDisplay = 'enum';
              }
              // Add suffix for complex types
              else if (typeDisplay === 'object') typeDisplay = 'object {...}';
              else if (typeDisplay === 'array') typeDisplay = 'array [...]';

              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>•</span>
                  <span>{key}</span>
                  <span style={{ opacity: 0.7, fontFamily: 'monospace', fontSize: '10px' }}>
                    : {typeDisplay}
                  </span>
                  {isRequired && <span style={{ opacity: 0.7, fontSize: '10px' }}>(required)</span>}
                </div>
              );
            })}
            {inputKeys.length > 3 && (
              <div style={{ fontSize: '10px', opacity: 0.8, fontStyle: 'italic' }}>
                +{inputKeys.length - 3} more...
              </div>
            )}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: '#fff' }} />
    </div>
  );
};
