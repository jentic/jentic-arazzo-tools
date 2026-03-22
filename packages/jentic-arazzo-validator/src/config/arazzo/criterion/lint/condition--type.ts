import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const conditionTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_CRITERION_FIELD_CONDITION_TYPE,
  source: 'apilint',
  message: 'condition must be a string',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['string'],
  marker: 'value',
  target: 'condition',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default conditionTypeLint;
