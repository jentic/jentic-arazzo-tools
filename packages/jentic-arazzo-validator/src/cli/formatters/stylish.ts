import chalk from 'chalk';
import type { Diagnostic } from 'vscode-languageserver-types';
import { DiagnosticSeverity } from 'vscode-languageserver-types';

export function severityToString(severity: DiagnosticSeverity | undefined): string {
  switch (severity) {
    case DiagnosticSeverity.Error:
      return chalk.red('error');
    case DiagnosticSeverity.Warning:
      return chalk.yellow('warning');
    case DiagnosticSeverity.Information:
      return chalk.blue('info');
    case DiagnosticSeverity.Hint:
      return chalk.cyan('hint');
    default:
      return 'unknown';
  }
}

export function formatLocation(diagnostic: Diagnostic): string {
  const line = diagnostic.range.start.line + 1;
  const col = diagnostic.range.start.character + 1;
  return `${line}:${col}`;
}

export interface FormatOptions {
  maxProblems?: number;
  sourceContent?: string;
}

export function formatStylish(
  filePath: string,
  diagnostics: Diagnostic[],
  options: FormatOptions = {},
): string {
  const { maxProblems } = options;
  const limitedDiagnostics = maxProblems ? diagnostics.slice(0, maxProblems) : diagnostics;

  if (limitedDiagnostics.length === 0) {
    return '';
  }

  const lines: string[] = [];

  // calculate max widths for alignment
  const maxLocationLength = Math.max(...limitedDiagnostics.map((d) => formatLocation(d).length));
  const maxCodeLength = Math.max(
    ...limitedDiagnostics.map((d) => (d.code ? String(d.code).length : 0)),
  );

  // file path header
  lines.push(chalk.bold(filePath));

  // diagnostics
  for (const diagnostic of limitedDiagnostics) {
    const locationStr = formatLocation(diagnostic);
    const location = chalk.dim(locationStr.padEnd(maxLocationLength));
    const severity = severityToString(diagnostic.severity);
    const codeStr = diagnostic.code ? String(diagnostic.code) : '';
    const code = codeStr ? chalk.cyan(codeStr.padEnd(maxCodeLength)) : ' '.repeat(maxCodeLength);
    const message = diagnostic.message;

    lines.push(`  ${location}  ${severity}  ${code}  ${message}`);
  }

  // summary
  const errorCount = limitedDiagnostics.filter(
    (d) => d.severity === DiagnosticSeverity.Error,
  ).length;
  const warningCount = limitedDiagnostics.filter(
    (d) => d.severity === DiagnosticSeverity.Warning,
  ).length;
  const infoCount = limitedDiagnostics.filter(
    (d) => d.severity === DiagnosticSeverity.Information,
  ).length;
  const hintCount = limitedDiagnostics.filter((d) => d.severity === DiagnosticSeverity.Hint).length;

  lines.push('');
  const parts: string[] = [];
  if (errorCount > 0) parts.push(`${errorCount} ${errorCount === 1 ? 'error' : 'errors'}`);
  if (warningCount > 0)
    parts.push(`${warningCount} ${warningCount === 1 ? 'warning' : 'warnings'}`);
  if (infoCount > 0) parts.push(`${infoCount} ${infoCount === 1 ? 'info' : 'infos'}`);
  if (hintCount > 0) parts.push(`${hintCount} ${hintCount === 1 ? 'hint' : 'hints'}`);
  const symbol = errorCount > 0 ? chalk.red('✖') : chalk.yellow('⚠');
  const problemText = limitedDiagnostics.length === 1 ? 'problem' : 'problems';
  const breakdown = parts.length > 0 ? ` (${parts.join(', ')})` : '';
  lines.push(`${symbol} ${limitedDiagnostics.length} ${problemText}${breakdown}`);

  if (maxProblems && diagnostics.length > maxProblems) {
    lines.push(chalk.dim(`(showing ${maxProblems} of ${diagnostics.length} problems)`));
  }

  return lines.join('\n');
}
