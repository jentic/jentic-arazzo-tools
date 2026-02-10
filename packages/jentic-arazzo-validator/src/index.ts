import { TextDocument } from 'vscode-languageserver-textdocument';
import { DiagnosticSeverity, type Diagnostic } from 'vscode-languageserver-types';
import {
  Arazzo1JsonSchemaValidationProvider,
  getLanguageService,
  type LanguageServiceContext,
} from '@speclynx/apidom-ls';
import { defaultArazzoOptions as defaultArazzoParserOptions } from '@jentic/arazzo-parser';
import {
  readFile,
  mergeOptions,
  type ApiDOMReferenceResolveOptions,
  type ApiDOMReferenceOptions,
} from '@speclynx/apidom-reference/configuration/empty';
import type { PartialDeep } from 'type-fest';

import { config } from './config/config.ts';

export { TextDocument, DiagnosticSeverity };
export type { Diagnostic, LanguageServiceContext };

/**
 * Default resolve options for URI resolution in validateURI.
 *
 * These options control how files and URLs are fetched when validating
 * Arazzo documents from URIs.
 *
 * @public
 */
export const defaultArazzoResolveOptions = defaultArazzoParserOptions.resolve;

/**
 * Default language service context for validation.
 *
 * Controls validation behavior including JSON Schema validation,
 * semantic validation, and linting rules.
 *
 * @public
 */
export const defaultLanguageServiceContext: Partial<LanguageServiceContext> = {
  metadata: config(),
  defaultContentLanguage: {
    namespace: 'arazzo',
    version: '1.0.1',
    mediaType: 'application/vnd.oai.workflows;version=1.0.1',
  },
  validatorProviders: [new Arazzo1JsonSchemaValidationProvider()],
  validationContext: {
    jsonSchemaValidation: true,
    semanticValidation: true,
    referenceValidation: false,
    semanticLinting: true,
    betterAjvErrors: true,
  },
  parseContext: {
    fileAllowList: ['*'],
    arazzo: {
      sourceDescriptionsResolution: true,
    },
  },
};

/**
 * Validates an Arazzo Document from a URI (file path or HTTP(S) URL).
 *
 * This is the primary API for validation. It fetches the document from the
 * specified URI and performs JSON Schema validation, semantic validation,
 * and linting.
 *
 * @param uri - The file system path or HTTP(S) URL to the Arazzo Document
 * @param context - Optional language service context override (shallow merged with defaults)
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
  context: Partial<LanguageServiceContext> = {},
  resolveOptions: PartialDeep<ApiDOMReferenceResolveOptions> = {},
): Promise<Diagnostic[]> {
  const mergedOptions = mergeOptions(defaultArazzoParserOptions as ApiDOMReferenceOptions, {
    resolve: resolveOptions,
  });
  const buffer = await readFile(uri, mergedOptions);
  const content = new TextDecoder().decode(buffer);
  const textDocument = TextDocument.create(uri, '', 1, content);

  return validate(textDocument, context);
}

/**
 * Validates an Arazzo Document from a TextDocument.
 *
 * This is a lower-level API for advanced use cases such as IDE integrations
 * or when you already have document content in memory.
 *
 * @param textDocument - The TextDocument containing the Arazzo Document content
 * @param context - Optional language service context override (shallow merged with defaults)
 * @returns Promise resolving to an array of Diagnostic objects
 *
 * @example
 * Basic usage
 * ```typescript
 * import { validate, TextDocument, DiagnosticSeverity } from '@jentic/arazzo-validator';
 *
 * const textDocument = TextDocument.create(
 *   'file:///path/to/arazzo.yaml',
 *   'yaml',
 *   1,
 *   content
 * );
 * const diagnostics = await validate(textDocument);
 * const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
 * ```
 *
 * @example
 * Disable JSON Schema validation
 * ```typescript
 * const diagnostics = await validate(textDocument, {
 *   validationContext: { jsonSchemaValidation: false }
 * });
 * ```
 * @public
 */
export async function validate(
  textDocument: TextDocument,
  context: Partial<LanguageServiceContext> = {},
): Promise<Diagnostic[]> {
  const mergedContext: LanguageServiceContext = { ...defaultLanguageServiceContext, ...context };
  const languageService = getLanguageService(mergedContext);

  try {
    return await languageService.doValidation(textDocument);
  } finally {
    languageService.terminate();
  }
}
