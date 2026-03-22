import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const requestBodyTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_REQUEST_BODY_TYPE,
  source: 'apilint',
  message: 'requestBody must be a Request Body Object',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintElementOrClass',
  linterParams: [['requestBody']],
  marker: 'value',
  target: 'requestBody',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default requestBodyTypeLint;
