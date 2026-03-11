import type { Diagnostic } from 'vscode-languageserver-types';
import type { LanguageServiceContext } from '@speclynx/apidom-ls';
import { defaultParseArazzoOptions } from '@jentic/arazzo-parser';
import {
  readFile,
  mergeOptions,
  type ApiDOMReferenceResolveOptions,
  type ApiDOMReferenceOptions,
} from '@speclynx/apidom-reference/configuration/empty';
import type { PartialDeep } from 'type-fest';

import { createTextDocument } from '../document.ts';
import { validate } from './validate.ts';

/**
 * Default resolve options for URI resolution in validateURI.
 *
 * These options control how files and URLs are fetched when validating
 * Arazzo documents from URIs.
 *
 * @public
 */
export const defaultArazzoResolveOptions = defaultParseArazzoOptions.resolve;

/**
 * Validates an Arazzo Document from a URI (file path or HTTP(S) URL).
 *
 * This is the primary API for validation. It fetches the document from the
 * specified URI and performs JSON Schema validation, semantic validation,
 * and linting.
 *
 * @param uri - The file system path or HTTP(S) URL to the Arazzo Document
 * @param context - Optional language service context override (deep merged with defaults)
 * @param resolveOptions - Optional resolve options for fetching the URI
 * @returns Promise resolving to an array of Diagnostic objects
 *
 * @example
 * Validate from file
 * ```typescript
 * import { validateURI, DiagnosticSeverity } from '@jentic/arazzo-validator';
 *
 * const diagnostics = await validateURI('/path/to/arazzo.yaml');
 * const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
 * ```
 *
 * @example
 * Validate from URL
 * ```typescript
 * const diagnostics = await validateURI('https://example.com/arazzo.yaml');
 * ```
 *
 * @example
 * Validate with custom context
 * ```typescript
 * const diagnostics = await validateURI('/path/to/arazzo.yaml', {
 *   validationContext: { jsonSchemaValidation: false }
 * });
 * ```
 *
 * @example
 * Validate with custom resolve options
 * ```typescript
 * const diagnostics = await validateURI('/path/to/arazzo.yaml', {}, {
 *   resolverOpts: { timeout: 10000 }
 * });
 * ```
 * @public
 */
export async function validateURI(
  uri: string,
  context: PartialDeep<LanguageServiceContext> = {},
  resolveOptions: PartialDeep<ApiDOMReferenceResolveOptions> = {},
): Promise<Diagnostic[]> {
  const mergedOptions = mergeOptions(defaultParseArazzoOptions as ApiDOMReferenceOptions, {
    resolve: resolveOptions,
  });
  const buffer = await readFile(uri, mergedOptions);
  const content = new TextDecoder().decode(buffer);
  const textDocument = createTextDocument(uri, content);

  return validate(textDocument, context);
}
