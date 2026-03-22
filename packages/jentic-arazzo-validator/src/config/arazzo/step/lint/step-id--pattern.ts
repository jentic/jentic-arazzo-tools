import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const stepIdPatternLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_STEP_ID_PATTERN,
  source: 'apilint',
  message: 'stepId must match the pattern [A-Za-z0-9_\\-]+',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintValueRegex',
  linterParams: ['^[A-Za-z0-9_\\-]+$'],
  marker: 'value',
  target: 'stepId',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default stepIdPatternLint;
