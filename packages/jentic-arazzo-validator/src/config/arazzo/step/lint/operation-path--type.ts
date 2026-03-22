import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const operationPathTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_OPERATION_PATH_TYPE,
  source: 'apilint',
  message: 'operationPath must be a string',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['string'],
  marker: 'value',
  target: 'operationPath',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default operationPathTypeLint;
