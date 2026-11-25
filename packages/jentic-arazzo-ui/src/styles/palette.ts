/**
 * Single source of truth for every color in the viewer (Jentic brand palette, ported from the
 * light theme in Jentic OS ui/src/index.css: warm off-white page, white cards, pale green-gray
 * borders, deep green primary, gold accent).
 *
 * - `palette` holds literal hex values for the places CSS variables can't reach: mermaid diagram
 *   theming (flowchart + sequence diagram; mermaid derives colors from its inputs) and react flow
 *   arrow markers (the color ends up in an SVG marker id).
 * - `themeTokens` maps every `--arazzo-*` color token to a value built from `palette`. It is
 *   injected as CSS custom properties by `injectTheme()` (see ./theme.ts), so no color lives in
 *   index.css. A host app can still re-theme by overriding the tokens on .arazzo-ui /
 *   .arazzo-ui-standalone.
 */
export const palette = {
  // surfaces
  bg: '#fbfaf9',
  bgSecondary: '#eff5f2',
  card: '#ffffff',
  cardSelected: '#f0fff9',
  border: '#d9e3de',
  borderHover: '#7ab8a1',
  inputBorder: '#7a8a84', // 3.6:1 on white so the field edge is visible
  // text
  fg: '#152822',
  fgLighter: '#495a54',
  mutedFg: '#5a6b65',
  subtleFg: '#8a9792', // 3:1 on white: lines, dividers and icons only, never text
  expressionFg: '#305256', // runtime expressions ($inputs, $response.body); neutral data
  onAccent: '#ffffff', // text drawn on top of a solid accent fill
  // green scale
  green100: '#ddf8ed',
  green300: '#0c8d5e',
  green700: '#bfe3d6',
  // brand
  primary: '#0b7a51',
  primaryHover: '#085e3e',
  // state
  success: '#06744c',
  warning: '#8e5a0b', // gold, darkened so badge text clears 4.5:1
  danger: '#c32230',
  destructive: '#b81e1e',
  info: '#206bb6',
  // accents
  accentOrange: '#d48611',
  accentOrangeFg: '#b3450f', // burnt orange for small text; keeps PATCH/PUT distinct from warning
  accentYellow: '#cc981e',
  accentGreen: '#0c8d5e',
  accentPink: '#c62a37',
  accentBlue: '#206bb6',
  // shadow / overlay bases
  ink: '#152822',
  black: '#000000',
} as const;

/** `#rrggbb` + alpha -> `rgb(r g b / a)` */
const alpha = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${a})`;
};

const p = palette;

/** `--arazzo-*` color tokens, injected as CSS custom properties */
export const themeTokens: Record<string, string> = {
  // green scale
  '--arazzo-primary-50': p.cardSelected,
  '--arazzo-primary-100': p.green100,
  '--arazzo-primary-300': p.green300,
  '--arazzo-primary-500': p.success,
  '--arazzo-primary-700': p.green700,
  '--arazzo-primary-850': p.bgSecondary,
  '--arazzo-primary-900': p.card,
  '--arazzo-primary-950': p.bg,

  // accents
  '--arazzo-accent-orange': p.accentOrange,
  '--arazzo-accent-yellow': p.accentYellow,
  '--arazzo-accent-green': p.accentGreen,
  '--arazzo-accent-pink': p.accentPink,
  '--arazzo-accent-blue': p.accentBlue,
  '--arazzo-accent-orange-bg': alpha(p.accentOrangeFg, 0.08),
  '--arazzo-accent-orange-fg': p.accentOrangeFg,

  // surfaces
  '--arazzo-bg': 'var(--arazzo-primary-950)',
  '--arazzo-bg-secondary': 'var(--arazzo-primary-850)',
  '--arazzo-card': 'var(--arazzo-primary-900)',
  '--arazzo-card-selected': 'var(--arazzo-primary-50)',
  '--arazzo-border': p.border,
  '--arazzo-border-hover': p.borderHover,
  '--arazzo-input-border': p.inputBorder,

  // text
  '--arazzo-fg': p.fg,
  '--arazzo-fg-lighter': p.fgLighter,
  '--arazzo-muted-fg': p.mutedFg,
  '--arazzo-subtle-fg': p.subtleFg,
  '--arazzo-expression-fg': p.expressionFg,
  '--arazzo-on-accent': p.onAccent,
  '--arazzo-on-accent-divider': alpha(p.onAccent, 0.3),

  // brand
  '--arazzo-primary': p.primary,
  '--arazzo-primary-hover': p.primaryHover,
  '--arazzo-primary-fg': p.onAccent,
  '--arazzo-primary-bg': alpha(p.green300, 0.08),
  '--arazzo-ring': 'var(--arazzo-primary-300)',
  '--arazzo-ring-glow': alpha(p.green300, 0.25),

  // selected diagram node: header strip tint and divider
  '--arazzo-selected-bg': 'var(--arazzo-primary-100)',
  '--arazzo-selected-border': 'var(--arazzo-primary-700)',

  // state
  '--arazzo-success': 'var(--arazzo-primary-500)',
  '--arazzo-success-hover': 'var(--arazzo-accent-green)',
  '--arazzo-success-bg': alpha(p.green300, 0.08),
  '--arazzo-success-border': alpha(p.green300, 0.3),
  '--arazzo-warning': p.warning,
  '--arazzo-warning-hover': 'var(--arazzo-accent-orange)',
  '--arazzo-warning-bg': alpha(p.accentOrange, 0.08),
  '--arazzo-warning-border': alpha(p.accentOrange, 0.3),
  '--arazzo-danger': p.danger,
  '--arazzo-danger-hover': 'var(--arazzo-accent-pink)',
  '--arazzo-danger-bg': alpha(p.danger, 0.06),
  '--arazzo-danger-border': alpha(p.danger, 0.3),
  '--arazzo-destructive': p.destructive,
  '--arazzo-info': 'var(--arazzo-accent-blue)',
  '--arazzo-info-bg': alpha(p.info, 0.08),
  '--arazzo-info-border': alpha(p.info, 0.3),

  // elevation - soft neutral shadows for light surfaces
  '--arazzo-shadow': `0 1px 2px 0 ${alpha(p.ink, 0.06)}`,
  '--arazzo-shadow-pop': `0 16px 40px -12px ${alpha(p.ink, 0.18)}, 0 4px 12px -4px ${alpha(p.ink, 0.1)}`,
  '--arazzo-shadow-node': `0 2px 8px ${alpha(p.black, 0.1)}`,
  '--arazzo-shadow-node-strong': `0 2px 8px ${alpha(p.black, 0.15)}`,
  '--arazzo-shadow-label': `0 2px 8px ${alpha(p.black, 0.2)}`,
  '--arazzo-shadow-dialog': `0 20px 50px ${alpha(p.black, 0.3)}`,

  // glow under a selected start / end / workflow-ref node
  '--arazzo-glow-success': `0 8px 24px ${alpha(p.green300, 0.3)}`,
  '--arazzo-glow-warning': `0 8px 24px ${alpha(p.accentOrange, 0.2)}`,
  '--arazzo-glow-neutral': `0 8px 24px ${alpha(p.black, 0.3)}`,

  // backdrop behind modal dialogs
  '--arazzo-overlay': alpha(p.ink, 0.45),
};
