import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const retryAfterOnlyRetryLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_FAILURE_ACTION_FIELD_RETRY_AFTER_ONLY_RETRY,
  source: 'apilint',
  message: 'retryAfter only applies when type is "retry"',
  severity: DiagnosticSeverity.Warning,
  linterFunction: 'apilintValueOrArray',
  linterParams: [['retry']],
  marker: 'key',
  markerTarget: 'retryAfter',
  target: 'type',
  conditions: [
    {
      function: 'missingField',
      params: ['retryAfter'],
      negate: true,
    },
  ],
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default retryAfterOnlyRetryLint;
