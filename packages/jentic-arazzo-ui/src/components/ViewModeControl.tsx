import React from 'react';
import { ViewerMode } from '../types/index';

const views: ViewerMode[] = ['diagram', 'docs', 'split'];

export interface ViewModeControlProps {
  value: ViewerMode;
  onChange: (view: ViewerMode) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ViewModeControl: React.FC<ViewModeControlProps> = ({
  value,
  onChange,
  className,
  style,
}) => {
  return (
    <div
      className={`arazzo-view-mode-control ${className ?? ''}`}
      style={{
        display: 'inline-flex',
        borderRadius: '6px',
        border: '1px solid var(--arazzo-border)',
        overflow: 'hidden',
        fontSize: '13px',
        ...style,
      }}
    >
      {views.map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            padding: '4px 12px',
            border: 'none',
            borderRight: v !== views[views.length - 1] ? '1px solid var(--arazzo-border)' : 'none',
            background: value === v ? 'var(--arazzo-primary)' : 'var(--arazzo-bg-secondary)',
            color: value === v ? 'var(--arazzo-primary-fg)' : 'var(--arazzo-fg-lighter)',
            cursor: value === v ? 'default' : 'pointer',
            fontWeight: value === v ? 600 : 400,
            textTransform: 'capitalize',
          }}
        >
          {v}
        </button>
      ))}
    </div>
  );
};
