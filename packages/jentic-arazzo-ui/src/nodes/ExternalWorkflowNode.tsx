import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ExternalWorkflowNodeData } from '../types/index';

/**
 * Node representing an external workflow target in action edges.
 * Similar to WorkflowNode but used as an edge target within a workflow diagram.
 */
export const ExternalWorkflowNode: React.FC<NodeProps<ExternalWorkflowNodeData>> = ({
  data,
  selected,
}) => {
  const { workflowId, workflow, onClick } = data;

  const borderColor = selected ? 'var(--arazzo-ring)' : 'var(--arazzo-border)';
  const boxShadow = selected
    ? '0 0 0 3px var(--arazzo-ring-glow), 0 8px 24px var(--arazzo-ring-glow)'
    : '0 2px 8px rgba(0,0,0,0.1)';

  const handleClick = () => {
    if (onClick) {
      onClick(workflowId);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: selected ? 'var(--arazzo-card-selected)' : 'var(--arazzo-card)',
        border: `2px solid ${borderColor}`,
        borderRadius: '10px',
        width: '420px',
        boxShadow,
        transition: 'all 0.15s ease-in-out',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Target handle at bottom for incoming edges */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{ background: 'var(--arazzo-border-hover)' }}
      />

      {/* Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: `1px solid ${selected ? 'var(--arazzo-selected-border)' : 'var(--arazzo-border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: selected ? 'var(--arazzo-selected-bg)' : 'var(--arazzo-bg-secondary)',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>⚡</span>
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--arazzo-fg)' }}>
            {workflowId}
          </span>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'var(--arazzo-info-bg)',
            color: 'var(--arazzo-info)',
          }}
        >
          WORKFLOW
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px' }}>
        {workflow?.summary ? (
          <p
            style={{
              fontSize: '11px',
              color: 'var(--arazzo-muted-fg)',
              margin: '0 0 8px',
              lineHeight: '1.4',
            }}
          >
            {workflow.summary}
          </p>
        ) : workflow?.description ? (
          <p
            style={{
              fontSize: '11px',
              color: 'var(--arazzo-muted-fg)',
              margin: '0 0 8px',
              lineHeight: '1.4',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {workflow.description}
          </p>
        ) : null}

        <div
          style={{
            display: 'flex',
            gap: '12px',
            fontSize: '11px',
            color: 'var(--arazzo-muted-fg)',
          }}
        >
          {workflow && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>📋</span>
              <span>
                {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {workflow?.inputs && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>📥</span>
              <span>Inputs</span>
            </div>
          )}
        </div>
      </div>

      {/* Click hint if clickable */}
      {onClick && (
        <div
          style={{
            padding: '8px 14px',
            borderTop: '1px solid var(--arazzo-border)',
            textAlign: 'center',
            fontSize: '10px',
            color: 'var(--arazzo-subtle-fg)',
            background: 'var(--arazzo-bg-secondary)',
            borderRadius: '0 0 8px 8px',
          }}
        >
          Click to open workflow
        </div>
      )}
    </div>
  );
};
