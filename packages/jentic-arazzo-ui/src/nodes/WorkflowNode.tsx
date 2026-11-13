import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { WorkflowNodeData } from '../types/index';

export const WorkflowNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data, selected }) => {
  const { workflow, onClick } = data;

  const borderColor = selected ? 'var(--arazzo-ring)' : 'var(--arazzo-border)';
  const boxShadow = selected
    ? '0 0 0 3px var(--arazzo-ring-glow), 0 8px 24px var(--arazzo-ring-glow)'
    : 'var(--arazzo-shadow-node)';

  const handleClick = () => {
    if (onClick) {
      onClick(workflow.workflowId);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: selected ? 'var(--arazzo-card-selected)' : 'var(--arazzo-card)',
        border: `2px solid ${borderColor}`,
        borderRadius: '12px',
        minWidth: '240px',
        maxWidth: '320px',
        boxShadow,
        transition: 'all 0.15s ease-in-out',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        cursor: 'pointer',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${selected ? 'var(--arazzo-selected-border)' : 'var(--arazzo-border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: selected ? 'var(--arazzo-selected-bg)' : 'var(--arazzo-bg-secondary)',
          borderRadius: '10px 10px 0 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>⚡</span>
          <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--arazzo-fg)' }}>
            {workflow.workflowId}
          </span>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: '4px',
            background: 'var(--arazzo-info-bg)',
            color: 'var(--arazzo-info)',
          }}
        >
          WORKFLOW
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        {workflow.summary && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--arazzo-muted-fg)',
              margin: '0 0 12px',
              lineHeight: '1.5',
            }}
          >
            {workflow.summary}
          </p>
        )}

        {workflow.description && !workflow.summary && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--arazzo-muted-fg)',
              margin: '0 0 12px',
              lineHeight: '1.5',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {workflow.description}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: '16px',
            fontSize: '12px',
            color: 'var(--arazzo-muted-fg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📋</span>
            <span>
              {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}
            </span>
          </div>
          {workflow.inputs && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📥</span>
              <span>Has inputs</span>
            </div>
          )}
          {workflow.outputs && Object.keys(workflow.outputs).length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📤</span>
              <span>Has outputs</span>
            </div>
          )}
        </div>
      </div>

      {/* Click hint */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--arazzo-border)',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--arazzo-subtle-fg)',
          background: 'var(--arazzo-bg-secondary)',
          borderRadius: '0 0 10px 10px',
        }}
      >
        Click to open workflow
      </div>

      {/* Hidden handles for layout purposes */}
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  );
};
