import type { DiagnosticPath } from '../validation';

/**
 * Encodes a document path, e.g. ['workflows', 0, 'steps', 1], as a single token for the
 * `data-doc-path` attribute. Segments are URI-encoded, so tokens never contain whitespace or
 * quotes and an element can list several paths separated by spaces.
 */
export function encodeDocPath(path: DiagnosticPath): string {
  return path.map((segment) => encodeURIComponent(String(segment))).join('/');
}

/**
 * Renders the `data-doc-path` attribute marking where an element of the source document is shown
 * in the docs, so validation diagnostics can link to it.
 */
export function docPathAttr(...paths: DiagnosticPath[]): string {
  return ` data-doc-path="${paths.map(encodeDocPath).join(' ')}"`;
}

/**
 * Finds the element showing the most specific part of `path`, falling back to enclosing paths
 * when the exact element isn't rendered.
 */
export function findDocPathElement(
  container: ParentNode,
  path: DiagnosticPath,
): HTMLElement | null {
  for (let length = path.length; length > 0; length--) {
    const token = encodeDocPath(path.slice(0, length));
    const element = container.querySelector<HTMLElement>(`[data-doc-path~="${token}"]`);
    if (element) return element;
  }
  return null;
}
