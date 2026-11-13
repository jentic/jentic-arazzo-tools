/**
 * Jentic brand palette as literal hex values, for the places CSS variables can't reach:
 * mermaid diagram theming (mermaid computes derived colors from its inputs) and react flow
 * arrow markers (the color ends up in an SVG marker id). Everything else uses the
 * `--arazzo-*` CSS custom properties in ./index.css, which must stay in sync with this file.
 */
export const palette = {
  bg: '#fbfaf9',
  bgSecondary: '#eff5f2',
  card: '#ffffff',
  border: '#d9e3de',
  borderHover: '#7ab8a1',
  fg: '#152822',
  fgLighter: '#495a54',
  subtleFg: '#8a9792',
  primary: '#0b7a51',
  onAccent: '#ffffff',
  success: '#0c8d5e',
  warning: '#8e5a0b',
  danger: '#c32230',
  info: '#206bb6',
  accentOrange: '#d48611',
} as const;
