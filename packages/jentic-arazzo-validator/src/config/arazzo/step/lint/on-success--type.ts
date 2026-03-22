import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const onSuccessTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_ON_SUCCESS_TYPE,
  source: 'apilint',
  message: 'onSuccess must be an array of Success Action or Reusable Objects',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArrayOfElementsOrClasses',
  linterParams: [['successAction', 'reusable']],
  marker: 'key',
  target: 'onSuccess',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default onSuccessTypeLint;
