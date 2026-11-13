import { parseArazzo } from '@jentic/arazzo-parser';

import type { ArazzoDocument } from '../types/index';

export type DiagnosticSeverityName = 'error' | 'warning' | 'info' | 'hint';

// location of a diagnostic in the document tree, e.g. ['workflows', 0, 'steps', 1, 'parameters', 2]
export type DiagnosticPath = (string | number)[];

export interface DocumentDiagnostic {
  severity: DiagnosticSeverityName;
  message: string;
  code?: string;
  // 1-based position in the source document
  line: number;
  column: number;
  path?: DiagnosticPath;
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

// minimal structural view of ApiDOM elements parsed with source maps
interface SourceElement {
  element?: string;
  content?: unknown;
  startOffset?: number;
  endOffset?: number;
  key?: SourceElement;
  value?: SourceElement;
  toValue?: () => unknown;
}

function contains(element: SourceElement | undefined, offset: number): boolean {
  return (
    typeof element?.startOffset === 'number' &&
    typeof element.endOffset === 'number' &&
    element.startOffset <= offset &&
    offset < element.endOffset
  );
}

function isArrayLike(element: SourceElement | undefined): boolean {
  return (
    Array.isArray(element?.content) &&
    (element.content as SourceElement[]).every((item) => item?.element !== 'member')
  );
}

/**
 * Finds the path of the deepest element containing `offset`.
 */
function resolvePath(
  element: SourceElement,
  offset: number,
  path: DiagnosticPath = [],
): { path: DiagnosticPath; element: SourceElement } {
  if (Array.isArray(element.content)) {
    const children = element.content as SourceElement[];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child?.element === 'member') {
        const key = String(child.key?.toValue?.() ?? '');
        // diagnostics anchored on a key refer to that key's value
        if (contains(child.key, offset)) {
          return { path: [...path, key], element: child.value ?? child };
        }
        if (child.value && contains(child.value, offset)) {
          return resolvePath(child.value, offset, [...path, key]);
        }
      } else if (contains(child, offset)) {
        return resolvePath(child, offset, [...path, i]);
      }
    }
  }
  return { path, element };
}

/**
 * Attaches a document path to each diagnostic by locating its start position in a
 * source-mapped parse of the same content.
 */
async function resolveDiagnosticPaths(
  content: string,
  diagnostics: { offset: number; diagnostic: DocumentDiagnostic }[],
): Promise<void> {
  let root: SourceElement | undefined;
  try {
    const parseResult = await parseArazzo(content, {
      parse: { parserOpts: { sourceMap: true, strict: false, sourceDescriptions: false } },
    });
    root = parseResult.api as unknown as SourceElement | undefined;
  } catch {
    // unparseable documents still get the plain diagnostics list
    return;
  }
  if (!root) return;

  for (const { offset, diagnostic } of diagnostics) {
    const { path, element } = resolvePath(root, offset);
    // JSON Schema errors about array items are reported on the array's key, with the
    // item index only in the message (e.g. `"2" property must have required property "value"`)
    const itemIndex = /^"(\d+)" property /.exec(diagnostic.message)?.[1];
    if (itemIndex !== undefined && isArrayLike(element)) {
      path.push(Number(itemIndex));
    }
    diagnostic.path = path;
  }
}

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

  const located = rawDiagnostics.map((d) => ({
    offset: textDocument.offsetAt(d.range.start),
    diagnostic: {
      severity: severityNames[d.severity ?? 1] ?? 'error',
      message: d.message,
      code: d.code !== undefined ? String(d.code) : undefined,
      line: d.range.start.line + 1,
      column: d.range.start.character + 1,
    } as DocumentDiagnostic,
  }));
  await resolveDiagnosticPaths(source.content, located);

  const diagnostics = located
    .map(({ diagnostic }) => diagnostic)
    .sort(
      (a, b) =>
        severityRank[a.severity] - severityRank[b.severity] ||
        a.line - b.line ||
        a.column - b.column,
    );

  return { status: 'done', diagnostics, hasSourcePositions: source.hasSourcePositions, notice };
}
