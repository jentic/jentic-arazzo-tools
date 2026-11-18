/**
 * Small square icon marking a source description, as an SVG string.
 */
export function sourceIcon(type: string): string {
  const color = type === 'openapi' ? 'var(--arazzo-primary)' : 'var(--arazzo-primary)';
  return `<svg class="source-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="12" height="12" rx="3" fill="${color}" opacity="0.15" stroke="${color}" stroke-width="1"/><circle cx="7" cy="7" r="2" fill="${color}"/></svg>`;
}
