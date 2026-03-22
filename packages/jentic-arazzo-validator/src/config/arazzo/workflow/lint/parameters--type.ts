import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const parametersTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_WORKFLOW_FIELD_PARAMETERS_TYPE,
  source: 'apilint',
  message: 'parameters must be an array of Parameter or Reusable Objects',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArrayOfElementsOrClasses',
  linterParams: [['parameter', 'reusable']],
  marker: 'key',
  target: 'parameters',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default parametersTypeLint;
