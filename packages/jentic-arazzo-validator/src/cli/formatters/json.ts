import type { Diagnostic } from 'vscode-languageserver-types';

export interface FormatOptions {
  maxProblems?: number;
}

export function formatJSON(
  filePath: string,
  diagnostics: Diagnostic[],
  options: FormatOptions = {},
): string {
  const { maxProblems } = options;
  const limitedDiagnostics = maxProblems ? diagnostics.slice(0, maxProblems) : diagnostics;

  const output = {
    filePath,
    diagnostics: limitedDiagnostics,
    summary: {
      total: limitedDiagnostics.length,
      truncated: maxProblems ? diagnostics.length > maxProblems : false,
      originalTotal: diagnostics.length,
    },
  };

  return JSON.stringify(output, null, 2);
}
