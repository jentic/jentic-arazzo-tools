import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const successActionsKeysPatternLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_COMPONENTS_FIELD_SUCCESS_ACTIONS_KEYS_PATTERN,
  source: 'apilint',
  message: 'component keys must match the pattern [a-zA-Z0-9.\\-_]+',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintKeysRegex',
  linterParams: ['^[a-zA-Z0-9.\\-_]+$'],
  marker: 'key',
  target: 'successActions',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default successActionsKeysPatternLint;
