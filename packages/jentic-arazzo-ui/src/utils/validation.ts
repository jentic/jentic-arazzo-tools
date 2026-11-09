import type { ArazzoDocument } from '../types/index';

export type DiagnosticSeverityName = 'error' | 'warning' | 'info' | 'hint';

export interface DocumentDiagnostic {
  severity: DiagnosticSeverityName;
  message: string;
  code?: string;
  // 1-based position in the source document
  line: number;
  column: number;
}

export type ValidationState =
  | { status: 'loading' }
  | {
      status: 'done';
      diagnostics: DocumentDiagnostic[];
      hasSourcePositions: boolean;
      notice?: string;
    }
  | { status: 'error'; message: string };

// LSP DiagnosticSeverity: 1 = Error, 2 = Warning, 3 = Information, 4 = Hint
const severityNames: Record<number, DiagnosticSeverityName> = {
  1: 'error',
  2: 'warning',
  3: 'info',
  4: 'hint',
};

const severityRank: Record<DiagnosticSeverityName, number> = {
  error: 0,
  warning: 1,
  info: 2,
  hint: 3,
};

function looksLikeURI(value: string): boolean {
  const trimmed = value.trim();
  return !trimmed.includes('\n') && !trimmed.startsWith('{');
}

async function loadSource(
  input: ArazzoDocument | string,
): Promise<{ uri: string; content: string; hasSourcePositions: boolean }> {
  const baseURI = globalThis.document?.baseURI ?? 'file:///';

  if (typeof input !== 'string') {
    // object input has no original source text; positions refer to the serialized JSON
    return {
      uri: new URL('arazzo.json', baseURI).toString(),
      content: JSON.stringify(input, null, 2),
      hasSourcePositions: false,
    };
  }

  if (looksLikeURI(input)) {
    const uri = new URL(input.trim(), baseURI).toString();
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${uri} (${response.status} ${response.statusText})`);
    }
    return { uri, content: await response.text(), hasSourcePositions: true };
  }

  const isJSON = input.trim().startsWith('{');
  return {
    uri: new URL(isJSON ? 'arazzo.json' : 'arazzo.yaml', baseURI).toString(),
    content: input,
    hasSourcePositions: true,
  };
}

/**
 * Runs @jentic/arazzo-validator against the original Arazzo source.
 *
 * The validator is loaded lazily so it never delays the initial render.
 */
export async function validateArazzoSource(
  input: ArazzoDocument | string,
): Promise<Extract<ValidationState, { status: 'done' }>> {
  const [{ validate, createTextDocument }, source] = await Promise.all([
    import('@jentic/arazzo-validator'),
    loadSource(input),
  ]);

  const textDocument = createTextDocument(source.uri, source.content);

  let rawDiagnostics: Awaited<ReturnType<typeof validate>>;
  let notice: string | undefined;
  try {
    rawDiagnostics = await validate(textDocument);
  } catch (error) {
    // resolving some source descriptions (e.g. `type: arazzo` over HTTP) can crash the
    // language service; fall back to validating this document on its own
    rawDiagnostics = await validate(textDocument, {
      parseContext: { arazzo: { sourceDescriptionsResolution: false } },
    });
    const reason = error instanceof Error ? error.message : String(error);
    notice = `Source descriptions could not be resolved (${reason}), so checks against referenced documents were skipped.`;
  }

  const diagnostics: DocumentDiagnostic[] = rawDiagnostics
    .map((d) => ({
      severity: severityNames[d.severity ?? 1] ?? 'error',
      message: d.message,
      code: d.code !== undefined ? String(d.code) : undefined,
      line: d.range.start.line + 1,
      column: d.range.start.character + 1,
    }))
    .sort(
      (a, b) =>
        severityRank[a.severity] - severityRank[b.severity] ||
        a.line - b.line ||
        a.column - b.column,
    );

  return { status: 'done', diagnostics, hasSourcePositions: source.hasSourcePositions, notice };
}
