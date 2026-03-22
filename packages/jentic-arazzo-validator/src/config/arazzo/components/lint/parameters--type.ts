import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const parametersTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_COMPONENTS_FIELD_PARAMETERS_TYPE,
  source: 'apilint',
  message: 'parameters must be an object',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['object'],
  marker: 'value',
  target: 'parameters',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default parametersTypeLint;
