import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const operationPathPreferOperationIdLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_OPERATION_PATH_PREFER_OPERATION_ID,
  source: 'apilint',
  message: "It is recommended to use 'operationId' rather than 'operationPath'.",
  severity: DiagnosticSeverity.Hint,
  linterFunction: 'missingField',
  linterParams: ['operationPath'],
  marker: 'value',
  markerTarget: 'operationPath',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default operationPathPreferOperationIdLint;
