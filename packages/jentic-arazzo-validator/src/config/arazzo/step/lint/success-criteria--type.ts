import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const successCriteriaTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_SUCCESS_CRITERIA_TYPE,
  source: 'apilint',
  message: 'successCriteria must be an array of Criterion Objects',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArrayOfElementsOrClasses',
  linterParams: [['criterion']],
  marker: 'key',
  target: 'successCriteria',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default successCriteriaTypeLint;
