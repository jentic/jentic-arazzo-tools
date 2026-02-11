import { TextDocument } from 'vscode-languageserver-textdocument';
import type { Diagnostic } from 'vscode-languageserver-types';
import { getLanguageService, LogLevel, type LanguageServiceContext } from '@speclynx/apidom-ls';
import type { PartialDeep } from 'type-fest';
import { mergeDeepRight } from 'ramda';

import { config } from '../config/config.ts';
import { Arazzo1JsonSchemaValidationProvider } from './json-schema-provider.ts';

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
  logLevel: LogLevel.NONE,
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
 * Validates an Arazzo Document from a TextDocument.
 *
 * This is a lower-level API for advanced use cases such as IDE integrations
 * or when you already have document content in memory.
 *
 * @param textDocument - The TextDocument containing the Arazzo Document content
 * @param context - Optional language service context override (deep merged with defaults)
 * @returns Promise resolving to an array of Diagnostic objects
 *
 * @example
 * Basic usage
 * ```typescript
 * import { validate, TextDocument, DiagnosticSeverity, ARAZZO_LANGUAGE_ID, DEFAULT_DOCUMENT_VERSION } from '@jentic/arazzo-validator';
 *
 * const textDocument = TextDocument.create(
 *   'file:///path/to/arazzo.yaml',
 *   ARAZZO_LANGUAGE_ID,
 *   DEFAULT_DOCUMENT_VERSION,
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
  context: PartialDeep<LanguageServiceContext> = {},
): Promise<Diagnostic[]> {
  const mergedContext = mergeDeepRight(
    defaultLanguageServiceContext,
    context,
  ) as LanguageServiceContext;
  const languageService = getLanguageService(mergedContext);

  try {
    return await languageService.doValidation(textDocument);
  } finally {
    languageService.terminate();
  }
}
