import { themeTokens } from './palette';

const STYLE_ID = 'arazzo-ui-theme';

/**
 * Inject the `--arazzo-*` color tokens from palette.ts as CSS custom properties. Uses `:where()`
 * so specificity is zero and any host override on .arazzo-ui / .arazzo-ui-standalone wins.
 */
export const injectTheme = (): void => {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const decls = Object.entries(themeTokens)
    .map(([name, value]) => `${name}:${value};`)
    .join('');
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `:where(.arazzo-ui,.arazzo-ui-standalone){${decls}}`;
  // prepend so host stylesheets of equal specificity come later and win
  document.head.prepend(style);
};
