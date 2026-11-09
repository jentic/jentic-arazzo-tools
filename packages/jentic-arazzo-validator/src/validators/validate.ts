import { TextDocument } from 'vscode-languageserver-textdocument';
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import type { Diagnostic } from 'vscode-languageserver-types';
import { mediaTypes } from '@speclynx/apidom-ns-arazzo-1';
import { getLanguageService, LogLevel, type LanguageServiceContext } from '@speclynx/apidom-ls';
import type { PartialDeep } from 'type-fest';
import { mergeDeepRight } from 'ramda';

import { config } from '../config/config.ts';
import ApilintCodes from '../config/codes.ts';
import { Arazzo1JsonSchemaValidationProvider } from './json-schema-provider.ts';
import {
  createVersionPositionMapper,
  detectArazzoVersion,
  isSupportedArazzoVersion,
  latestSupportedArazzoVersion,
  replaceArazzoVersion,
  supportedArazzoVersions,
} from './arazzo-version.ts';

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
    mediaType: mediaTypes.findBy('1.0.1'),
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
  const content = textDocument.getText();
  const detected = await detectArazzoVersion(content);

  if (detected === undefined) {
    const lastChar = textDocument.positionAt(content.length);
    return [
      {
        range: {
          start: { line: 0, character: 0 },
          end: { line: lastChar.line, character: lastChar.character },
        },
        message: 'Document content is not recognized as an Arazzo Specification',
        severity: DiagnosticSeverity.Error,
        code: ApilintCodes.ARAZZO_NOT_DETECTED,
        source: 'apilint',
      },
    ];
  }

  const mergedContext = mergeDeepRight(
    defaultLanguageServiceContext,
    context,
  ) as LanguageServiceContext;
  const languageService = getLanguageService(mergedContext);

  try {
    if (isSupportedArazzoVersion(detected.version)) {
      return await languageService.doValidation(textDocument);
    }

    // the bundled rules and JSON Schema only target supported versions, so an unsupported
    // version would otherwise skip all checks; validate against the latest supported version instead
    const versionDiagnostic: Diagnostic = {
      range: {
        start: textDocument.positionAt(detected.start),
        end: textDocument.positionAt(detected.end),
      },
      message: `Arazzo version ${detected.version} is not supported (supported: ${supportedArazzoVersions.join(', ')}); validated against Arazzo ${latestSupportedArazzoVersion} rules`,
      severity: DiagnosticSeverity.Error,
      code: ApilintCodes.ARAZZO_SPEC_FIELD_ARAZZO_VERSION_SUPPORTED,
      source: 'apilint',
    };
    const rewrittenDocument = TextDocument.create(
      textDocument.uri,
      textDocument.languageId,
      textDocument.version,
      replaceArazzoVersion(content, detected, latestSupportedArazzoVersion),
    );
    const mapPosition = createVersionPositionMapper(
      textDocument,
      detected,
      latestSupportedArazzoVersion,
    );
    const diagnostics = await languageService.doValidation(rewrittenDocument);

    return [
      versionDiagnostic,
      ...diagnostics.map((diagnostic) => ({
        ...diagnostic,
        range: {
          start: mapPosition(diagnostic.range.start),
          end: mapPosition(diagnostic.range.end),
        },
      })),
    ];
  } finally {
    languageService.terminate();
  }
}
