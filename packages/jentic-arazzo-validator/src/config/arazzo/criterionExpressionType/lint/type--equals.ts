import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const typeEqualsLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_TYPE_EQUALS,
  source: 'apilint',
  message: "type must be one of: 'jsonpath', 'xpath'",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintValueOrArray',
  linterParams: [['jsonpath', 'xpath']],
  marker: 'value',
  target: 'type',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default typeEqualsLint;
