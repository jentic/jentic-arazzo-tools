import type { Diagnostic } from 'vscode-languageserver-types';
import { DiagnosticSeverity } from 'vscode-languageserver-types';

function severityToGitHub(severity: DiagnosticSeverity | undefined): string {
  switch (severity) {
    case DiagnosticSeverity.Error:
      return 'error';
    case DiagnosticSeverity.Warning:
      return 'warning';
    case DiagnosticSeverity.Information:
    case DiagnosticSeverity.Hint:
      return 'notice';
    default:
      return 'notice';
  }
}

function escapeMessage(message: string): string {
  return message.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

export interface FormatOptions {
  maxProblems?: number;
}

/**
 * Formats diagnostics as GitHub Actions workflow commands.
 * @see https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions
 */
export function formatGitHubActions(
  filePath: string,
  diagnostics: Diagnostic[],
  options: FormatOptions = {},
): string {
  const { maxProblems } = options;
  const limitedDiagnostics = maxProblems ? diagnostics.slice(0, maxProblems) : diagnostics;

  const lines: string[] = [];

  for (const diagnostic of limitedDiagnostics) {
    const level = severityToGitHub(diagnostic.severity);
    const line = diagnostic.range.start.line + 1;
    const col = diagnostic.range.start.character + 1;
    const endLine = diagnostic.range.end.line + 1;
    const endCol = diagnostic.range.end.character + 1;
    const message = escapeMessage(diagnostic.message);
    const title = diagnostic.code ? String(diagnostic.code) : 'validation';

    lines.push(
      `::${level} file=${filePath},line=${line},col=${col},endLine=${endLine},endColumn=${endCol},title=${title}::${message}`,
    );
  }

  return lines.join('\n');
}
