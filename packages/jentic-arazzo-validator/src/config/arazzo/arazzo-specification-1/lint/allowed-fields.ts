import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { type LinterMeta, ApilintCodes } from '@speclynx/apidom-ls';

import { Arazzo1 } from '../../target-specs.ts';

const allowedFieldsLint: LinterMeta = {
  code: ApilintCodes.NOT_ALLOWED_FIELDS,
  source: 'apilint',
  message: 'Object includes not allowed fields',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'allowedFields',
  linterParams: [['arazzo', 'info', 'sourceDescriptions', 'workflows', 'components'], 'x-'],
  marker: 'key',
  targetSpecs: Arazzo1,
};

export default allowedFieldsLint;
