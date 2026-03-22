import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const onFailureTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_ON_FAILURE_TYPE,
  source: 'apilint',
  message: 'onFailure must be an array of Failure Action or Reusable Objects',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArrayOfElementsOrClasses',
  linterParams: [['failureAction', 'reusable']],
  marker: 'key',
  target: 'onFailure',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default onFailureTypeLint;
