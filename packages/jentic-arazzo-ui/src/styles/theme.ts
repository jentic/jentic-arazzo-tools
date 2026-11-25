import { themeTokens } from './palette';

const STYLE_ID = 'arazzo-ui-theme';

/**
 * apply token defaults at the outermost viewer so nested panes inherit host overrides.
 * both :where() clauses keep the selector specificity at zero.
 */
export const injectTheme = (): void => {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const decls = Object.entries(themeTokens)
    .map(([name, value]) => `${name}:${value};`)
    .join('');
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `:where(.arazzo-ui,.arazzo-ui-standalone):not(:where(.arazzo-ui *,.arazzo-ui-standalone *)){${decls}}`;
  // prepend so host stylesheets of equal specificity come later and win
  document.head.prepend(style);
};
