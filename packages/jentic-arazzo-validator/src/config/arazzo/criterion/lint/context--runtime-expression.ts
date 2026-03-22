import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const contextRuntimeExpressionLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_CRITERION_FIELD_CONTEXT_RUNTIME_EXPRESSION,
  source: 'apilint',
  message: 'Criterion "context" must be a valid Arazzo Runtime Expression.',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArazzoRuntimeExpression',
  linterParams: [],
  marker: 'value',
  target: 'context',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default contextRuntimeExpressionLint;
