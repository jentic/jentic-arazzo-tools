import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const criteriaTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_FAILURE_ACTION_FIELD_CRITERIA_TYPE,
  source: 'apilint',
  message: 'criteria must be an array of Criterion Objects',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArrayOfElementsOrClasses',
  linterParams: [['criterion']],
  marker: 'key',
  target: 'criteria',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default criteriaTypeLint;
