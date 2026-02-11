import { readFileSync, writeFileSync } from 'node:fs';
import { program, Option, InvalidArgumentError } from 'commander';
import type { Diagnostic } from 'vscode-languageserver-types';
import { DiagnosticSeverity } from 'vscode-languageserver-types';

import { validateURI } from '../validators/validate-uri.ts';
import { validate as validateDocument } from '../validators/validate.ts';
import { createTextDocument } from '../document.ts';
import {
  formatStylish,
  formatCodeframe,
  formatJSON,
  formatGitHubActions,
} from './formatters/index.ts';

type FormatType = 'stylish' | 'codeframe' | 'json' | 'github-actions';
type SeverityLevel = 'error' | 'warning' | 'info' | 'hint';

export const severityMap: Record<SeverityLevel, DiagnosticSeverity> = {
  error: DiagnosticSeverity.Error,
  warning: DiagnosticSeverity.Warning,
  info: DiagnosticSeverity.Information,
  hint: DiagnosticSeverity.Hint,
};

interface CLIOptions {
  format: FormatType;
  output?: string;
  failSeverity: SeverityLevel;
  maxProblems?: number;
  quiet: boolean;
  verbose: boolean;
  stdinRetrievalUri?: string;
}

export interface FormatDiagnosticsOptions {
  maxProblems?: number;
  sourceContent?: string;
}

export function formatDiagnostics(
  format: FormatType,
  filePath: string,
  diagnostics: Diagnostic[],
  options: FormatDiagnosticsOptions = {},
): string {
  switch (format) {
    case 'codeframe':
      return formatCodeframe(filePath, diagnostics, options);
    case 'json':
      return formatJSON(filePath, diagnostics, options);
    case 'github-actions':
      return formatGitHubActions(filePath, diagnostics, options);
    case 'stylish':
    default:
      return formatStylish(filePath, diagnostics, options);
  }
}

export function hasFailures(diagnostics: Diagnostic[], failSeverity: SeverityLevel): boolean {
  const threshold = severityMap[failSeverity];
  return diagnostics.some((d) => d.severity !== undefined && d.severity <= threshold);
}

function parseMaxProblems(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new InvalidArgumentError('Must be a non-negative integer.');
  }
  return parsed;
}

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];

  return new Promise((resolve, reject) => {
    process.stdin.on('data', (chunk: Buffer | string) => {
      if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
      } else {
        chunks.push(chunk);
      }
    });
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    process.stdin.on('error', reject);
  });
}

async function runValidation(
  file: string | undefined,
  options: CLIOptions,
): Promise<{ diagnostics: Diagnostic[]; filePath: string; sourceContent?: string }> {
  let diagnostics: Diagnostic[];
  let filePath: string;
  let sourceContent: string | undefined;

  if (options.stdinRetrievalUri) {
    // read from stdin
    sourceContent = await readStdin();
    filePath = options.stdinRetrievalUri;
    const textDocument = createTextDocument(filePath, sourceContent);
    diagnostics = await validateDocument(textDocument);
  } else if (file) {
    // validate file/URL
    filePath = file;
    diagnostics = await validateURI(file);
    // try to read file content for code snippets (only for local files)
    if (!file.startsWith('http://') && !file.startsWith('https://')) {
      try {
        sourceContent = readFileSync(file, 'utf-8');
      } catch {
        // ignore - file might not be readable
      }
    }
  } else {
    throw new Error('No input provided. Specify a file or use --stdin-retrieval-uri');
  }

  return { diagnostics, filePath, sourceContent };
}

export async function main(argv: string[] = process.argv): Promise<void> {
  // dynamic import for package.json to get version
  const pkg = await import('../../package.json', { with: { type: 'json' } });

  program
    .name('arazzo-validator')
    .description('Validate and lint Arazzo Specification documents')
    .version(pkg.default.version)
    .exitOverride((err) => {
      if (err.code === 'commander.invalidArgument') {
        process.exitCode = 2;
      }
      throw err;
    })
    .argument('[file]', 'File path or URL to validate')
    .option('--stdin-retrieval-uri <uri>', 'Read from stdin, use URI for reference resolution')
    .addOption(
      new Option('-f, --format <format>', 'Output format')
        .choices(['stylish', 'codeframe', 'json', 'github-actions'])
        .default('stylish'),
    )
    .option('-o, --output <file>', 'Write output to file instead of stdout')
    .addOption(
      new Option('--fail-severity <level>', 'Exit with error if diagnostics >= level')
        .choices(['error', 'warning', 'info', 'hint'])
        .default('error'),
    )
    .option('--max-problems <n>', 'Limit output to N problems', parseMaxProblems)
    .option('-q, --quiet', 'Suppress output, only return exit code', false)
    .option('-v, --verbose', 'Show additional information', false)
    .action(async (file: string | undefined, opts: CLIOptions) => {
      try {
        if (opts.verbose) {
          console.error(`Validating: ${file ?? opts.stdinRetrievalUri ?? 'stdin'}`);
        }

        const startTime = performance.now();
        const { diagnostics, filePath, sourceContent } = await runValidation(file, opts);
        const duration = performance.now() - startTime;

        if (opts.verbose) {
          const errorCount = diagnostics.filter(
            (d) => d.severity === DiagnosticSeverity.Error,
          ).length;
          const warningCount = diagnostics.filter(
            (d) => d.severity === DiagnosticSeverity.Warning,
          ).length;
          console.error(`Completed in ${(duration / 1000).toFixed(2)}s`);
          console.error(
            `Found ${diagnostics.length} problems (${errorCount} errors, ${warningCount} warnings)`,
          );
        }

        // format output
        const output = formatDiagnostics(opts.format, filePath, diagnostics, {
          maxProblems: opts.maxProblems,
          sourceContent,
        });

        // write output
        if (!opts.quiet && output) {
          if (opts.output) {
            writeFileSync(opts.output, output);
            if (opts.verbose) {
              console.error(`Output written to ${opts.output}`);
            }
          } else {
            console.log(output);
          }
        }

        // exit code based on fail severity
        const failed = hasFailures(diagnostics, opts.failSeverity);
        if (failed) {
          process.exitCode = 1;
        } else if (!opts.quiet && (opts.format === 'stylish' || opts.format === 'codeframe')) {
          // show success message for human-readable formats only
          console.log(`No results with a severity of '${opts.failSeverity}' or higher found!`);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error: ${error.message}`);
        } else {
          console.error('An unexpected error occurred');
        }
        process.exitCode = 2;
      }
    });

  try {
    await program.parseAsync(argv);
  } catch {
    // exitOverride throws - error already handled, exit code already set
  }
}
