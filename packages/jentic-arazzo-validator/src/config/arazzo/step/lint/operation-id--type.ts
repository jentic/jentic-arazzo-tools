import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const operationIdTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_OPERATION_ID_TYPE,
  source: 'apilint',
  message: 'operationId must be a string',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['string'],
  marker: 'value',
  target: 'operationId',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default operationIdTypeLint;
