import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const operationPathMutuallyExclusiveLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_OPERATION_PATH_MUTUALLY_EXCLUSIVE,
  source: 'apilint',
  message: 'operationPath is mutually exclusive with operationId and workflowId',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'missingFields',
  linterParams: [['operationId', 'workflowId']],
  marker: 'key',
  markerTarget: 'operationPath',
  conditions: [
    {
      function: 'missingField',
      params: ['operationPath'],
      negate: true,
    },
  ],
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default operationPathMutuallyExclusiveLint;
