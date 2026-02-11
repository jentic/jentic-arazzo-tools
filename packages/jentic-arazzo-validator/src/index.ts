import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver-types';
import type { LanguageServiceContext } from '@speclynx/apidom-ls';

export { Diagnostic, DiagnosticSeverity };
export type { LanguageServiceContext };

export {
  TextDocument,
  ARAZZO_LANGUAGE_ID,
  DEFAULT_DOCUMENT_VERSION,
  createTextDocument,
} from './document.ts';
export { validate, defaultLanguageServiceContext } from './validators/validate.ts';
export { validateURI, defaultArazzoResolveOptions } from './validators/validate-uri.ts';
