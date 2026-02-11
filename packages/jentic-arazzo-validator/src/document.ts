import { TextDocument } from 'vscode-languageserver-textdocument';

export { TextDocument };

/**
 * Language ID for Arazzo documents used with TextDocument.
 *
 * @public
 */
export const ARAZZO_LANGUAGE_ID = 'apidom';

/**
 * Default document version for TextDocument instances.
 *
 * @public
 */
export const DEFAULT_DOCUMENT_VERSION = 1;

/**
 * Creates a TextDocument for Arazzo validation.
 *
 * @param uri - The document URI
 * @param content - The document content
 * @returns A TextDocument instance
 * @public
 */
export function createTextDocument(uri: string, content: string): TextDocument {
  return TextDocument.create(uri, ARAZZO_LANGUAGE_ID, DEFAULT_DOCUMENT_VERSION, content);
}
