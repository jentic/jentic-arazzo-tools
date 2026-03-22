import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const outputsKeysPatternLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_OUTPUTS_KEYS_PATTERN,
  source: 'apilint',
  message: 'output keys must match the pattern [a-zA-Z0-9.\\-_]+',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintKeysRegex',
  linterParams: ['^[a-zA-Z0-9.\\-_]+$'],
  marker: 'key',
  target: 'outputs',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default outputsKeysPatternLint;
