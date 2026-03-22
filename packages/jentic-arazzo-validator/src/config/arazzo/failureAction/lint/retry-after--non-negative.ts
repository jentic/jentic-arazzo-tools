import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const retryAfterNonNegativeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_FAILURE_ACTION_FIELD_RETRY_AFTER_NON_NEGATIVE,
  source: 'apilint',
  message: 'retryAfter must be a non-negative number',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintNumber',
  linterParams: [false, true, true],
  marker: 'value',
  target: 'retryAfter',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default retryAfterNonNegativeLint;
