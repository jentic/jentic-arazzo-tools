import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const failureActionsKeysPatternLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_COMPONENTS_FIELD_FAILURE_ACTIONS_KEYS_PATTERN,
  source: 'apilint',
  message: 'component keys must match the pattern [a-zA-Z0-9.\\-_]+',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintKeysRegex',
  linterParams: ['^[a-zA-Z0-9.\\-_]+$'],
  marker: 'key',
  target: 'failureActions',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default failureActionsKeysPatternLint;
