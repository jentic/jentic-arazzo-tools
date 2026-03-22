import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const typeEqualsLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SUCCESS_ACTION_FIELD_TYPE_EQUALS,
  source: 'apilint',
  message: "type must be one of: 'end', 'goto'",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintValueOrArray',
  linterParams: [['end', 'goto']],
  marker: 'value',
  target: 'type',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default typeEqualsLint;
