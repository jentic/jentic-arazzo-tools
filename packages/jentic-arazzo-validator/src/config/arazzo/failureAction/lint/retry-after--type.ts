import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const retryAfterTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_FAILURE_ACTION_FIELD_RETRY_AFTER_TYPE,
  source: 'apilint',
  message: 'retryAfter must be a number',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['number'],
  marker: 'value',
  target: 'retryAfter',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default retryAfterTypeLint;
