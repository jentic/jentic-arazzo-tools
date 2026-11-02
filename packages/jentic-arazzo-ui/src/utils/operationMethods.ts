import type { CSSProperties } from 'react';

/** badge colors per upper-case HTTP method */
const HTTP_METHOD_COLORS: Record<string, { background: string; color: string }> = {
  GET: { background: '#dbeafe', color: '#1e40af' },
  POST: { background: '#dcfce7', color: '#166534' },
  PUT: { background: '#fef3c7', color: '#92400e' },
  PATCH: { background: '#ede9fe', color: '#5b21b6' },
  DELETE: { background: '#fee2e2', color: '#991b1b' },
};

/** inline style of the HTTP method pill shown next to a step in the diagram and docs views */
export function renderMethodBadgeStyle(method: string): CSSProperties {
  const { background, color } = HTTP_METHOD_COLORS[method] ?? {
    background: '#f3f4f6',
    color: '#374151',
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
