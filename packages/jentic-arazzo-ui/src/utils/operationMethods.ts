import type { CSSProperties } from 'react';

/** badge colors per upper-case HTTP method */
const HTTP_METHOD_COLORS: Record<string, { background: string; color: string }> = {
  GET: { background: 'var(--arazzo-info-bg)', color: 'var(--arazzo-info)' },
  POST: { background: 'var(--arazzo-success-bg)', color: 'var(--arazzo-success)' },
  PUT: { background: 'var(--arazzo-warning-bg)', color: 'var(--arazzo-warning)' },
  PATCH: { background: 'var(--arazzo-accent-orange-bg)', color: 'var(--arazzo-accent-orange)' },
  DELETE: { background: 'var(--arazzo-danger-bg)', color: 'var(--arazzo-danger)' },
};

/** inline style of the HTTP method pill shown next to a step in the diagram and docs views */
export function renderMethodBadgeStyle(method: string): CSSProperties {
  const { background, color } = HTTP_METHOD_COLORS[method] ?? {
    background: 'var(--arazzo-bg-secondary)',
    color: 'var(--arazzo-fg-lighter)',
  };
  return {
    marginLeft: 'auto',
    fontSize: '10px',
    fontWeight: 700,
    padding: '1px 6px',
    borderRadius: '3px',
    background,
    color,
  };
}
