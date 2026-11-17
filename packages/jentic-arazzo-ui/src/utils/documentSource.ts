import { Resolver, type File } from '@speclynx/apidom-reference/configuration/empty';
import { detect as detectArazzoJSON } from '@speclynx/apidom-parser-adapter-arazzo-json-1';
import { detect as detectArazzoYAML } from '@speclynx/apidom-parser-adapter-arazzo-yaml-1';

import type { ArazzoDocument } from '../types/index';

/**
 * The source of the document being viewed, loaded once and shared by parsing and validation so
 * both describe the same revision of a document given by URL.
 */
export type DocumentSource =
  | { kind: 'url'; uri: string; content: string }
  | { kind: 'inline'; uri: string; content: string }
  // object input has no original source text; positions refer to the serialized JSON
  | { kind: 'object'; uri: string; content: string; object: ArazzoDocument };

/**
 * Detects inline Arazzo content the same way parseArazzo does. Returns undefined when the string
 * should be treated as a URI.
 */
async function detectInlineFormat(value: string): Promise<'json' | 'yaml' | undefined> {
  if (await detectArazzoJSON(value, { strict: true })) return 'json';
  if (await detectArazzoYAML(value, { strict: true })) return 'yaml';
  return undefined;
}

/**
 * Loads the document source: inline content as is, objects serialized, and a URL (resolved
 * against the page, so relative paths work) fetched once.
 */
export async function loadDocumentSource(input: ArazzoDocument | string): Promise<DocumentSource> {
  const baseURI = globalThis.document?.baseURI ?? 'file:///';

  if (typeof input !== 'string') {
    return {
      kind: 'object',
      uri: new URL('arazzo.json', baseURI).toString(),
      content: JSON.stringify(input, null, 2),
      object: input,
    };
  }

  const inlineFormat = await detectInlineFormat(input);
  if (inlineFormat) {
    return {
      kind: 'inline',
      uri: new URL(`arazzo.${inlineFormat}`, baseURI).toString(),
      content: input,
    };
  }

  // content the detectors rejected (e.g. YAML or JSON with a syntax error) must not be fetched as
  // a URL: that sends the document to the page's server and reports it as a garbled URL
  const notArazzo = new Error(
    'The document could not be read as Arazzo JSON or YAML; it may contain a syntax error',
  );
  if (/[\r\n]/.test(input.trim()) || /^[{[]/.test(input.trim())) throw notArazzo;
  let resolved: URL;
  try {
    resolved = new URL(input.trim(), baseURI);
  } catch (error) {
    throw new Error(notArazzo.message, { cause: error });
  }
  // e.g. single-line `arazzo: 1.0.1 info` parses as a URL with an `arazzo:` scheme
  if (!['http:', 'https:', 'file:', 'blob:'].includes(resolved.protocol)) throw notArazzo;
  const uri = resolved.toString();
  let response: Response;
  try {
    response = await fetch(uri);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch ${uri} (${reason})`, { cause: error });
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch ${uri} (${response.status} ${response.statusText})`);
  }
  return { kind: 'url', uri, content: await response.text() };
}

const normalizeURI = (uri: string): string => {
  try {
    return new URL(uri).href.replace(/#.*$/, '');
  } catch {
    return uri;
  }
};

/**
 * Serves an already fetched document to the parser in place of requesting its URL again. Other
 * URIs (e.g. source descriptions) fall through to the parser's own resolvers.
 */
export class PrefetchedResolver extends Resolver {
  declare readonly uri: string;

  declare readonly content: string;

  constructor(source: { uri: string; content: string }) {
    super({ name: 'jentic-prefetched' });
    Object.assign(this, { uri: normalizeURI(source.uri), content: source.content });
  }

  canRead(file: File): boolean {
    return normalizeURI(file.uri) === this.uri;
  }

  async read(): Promise<Buffer> {
    return new TextEncoder().encode(this.content) as unknown as Buffer;
  }
}
