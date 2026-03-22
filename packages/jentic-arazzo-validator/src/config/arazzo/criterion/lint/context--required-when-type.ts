import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const contextRequiredWhenTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_CRITERION_FIELD_CONTEXT_REQUIRED_WHEN_TYPE,
  source: 'apilint',
  message: 'context MUST be provided when type is specified',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'hasRequiredField',
  linterParams: ['context'],
  marker: 'key',
  markerTarget: 'type',
  conditions: [
    {
      function: 'missingField',
      params: ['type'],
      negate: true,
    },
  ],
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default contextRequiredWhenTypeLint;
