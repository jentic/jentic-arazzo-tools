import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const valueRuntimeExpressionLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_PARAMETER_FIELD_VALUE_RUNTIME_EXPRESSION,
  source: 'apilint',
  message:
    'Parameter value starting with "$" must be a valid Arazzo Runtime Expression.',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArazzoValueRuntimeExpression',
  linterParams: [],
  marker: 'value',
  target: 'value',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default valueRuntimeExpressionLint;
