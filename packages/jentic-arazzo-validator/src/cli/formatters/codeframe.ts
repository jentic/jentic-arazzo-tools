import chalk from 'chalk';
import type { Diagnostic } from 'vscode-languageserver-types';
import { DiagnosticSeverity } from 'vscode-languageserver-types';

import { severityToString, formatLocation, type FormatOptions } from './stylish.ts';

function formatCodeSnippet(
  sourceLines: string[],
  diagnostic: Diagnostic,
  gutterWidth: number,
): string[] {
  const lines: string[] = [];
  const startLine = diagnostic.range.start.line;
  const startChar = diagnostic.range.start.character;
  const endChar = diagnostic.range.end.character;

  // show context: 1 line before, problem line, 1 line after
  const contextStart = Math.max(0, startLine - 1);
  const contextEnd = Math.min(sourceLines.length - 1, startLine + 1);

  for (let i = contextStart; i <= contextEnd; i++) {
    const lineNum = i + 1;
    const gutter = chalk.dim(`${String(lineNum).padStart(gutterWidth)} |`);
    const sourceLine = sourceLines[i] || '';
    lines.push(`${gutter} ${sourceLine}`);

    // add caret line under the problem line
    if (i === startLine) {
      const caretGutter = chalk.dim(`${' '.repeat(gutterWidth)} |`);
      const caretLength = Math.max(1, endChar - startChar);
      const carets = chalk.red('^'.repeat(caretLength));
      lines.push(`${caretGutter} ${' '.repeat(startChar)}${carets}`);
    }
  }

  return lines;
}

export function formatCodeframe(
  filePath: string,
  diagnostics: Diagnostic[],
  options: FormatOptions = {},
): string {
  const { maxProblems, sourceContent } = options;
  const limitedDiagnostics = maxProblems ? diagnostics.slice(0, maxProblems) : diagnostics;

  if (limitedDiagnostics.length === 0) {
    return '';
  }

  const sourceLines = sourceContent?.split('\n');
  const maxLineNum = sourceLines?.length ?? 0;
  const gutterWidth = Math.max(String(maxLineNum).length, 2);

  // calculate max widths for alignment
  const maxLocationLength = Math.max(...limitedDiagnostics.map((d) => formatLocation(d).length));
  const maxCodeLength = Math.max(
    ...limitedDiagnostics.map((d) => (d.code ? String(d.code).length : 0)),
  );

  const lines: string[] = [];

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

    // add code snippet if source content is available
    if (sourceLines) {
      lines.push('');
      lines.push(...formatCodeSnippet(sourceLines, diagnostic, gutterWidth));
      lines.push('');
    }
  }

  // summary
  const errorCount = limitedDiagnostics.filter(
    (d) => d.severity === DiagnosticSeverity.Error,
  ).length;
  const warningCount = limitedDiagnostics.filter(
    (d) => d.severity === DiagnosticSeverity.Warning,
  ).length;

  lines.push('');
  const errorText = errorCount === 1 ? 'error' : 'errors';
  const warningText = warningCount === 1 ? 'warning' : 'warnings';
  const symbol = errorCount > 0 ? chalk.red('✖') : chalk.yellow('⚠');
  lines.push(
    `${symbol} ${limitedDiagnostics.length} problems (${errorCount} ${errorText}, ${warningCount} ${warningText})`,
  );

  if (maxProblems && diagnostics.length > maxProblems) {
    lines.push(chalk.dim(`(showing ${maxProblems} of ${diagnostics.length} problems)`));
  }

  return lines.join('\n');
}
