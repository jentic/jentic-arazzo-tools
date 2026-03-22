import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const workflowIdMutuallyExclusiveLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_WORKFLOW_ID_MUTUALLY_EXCLUSIVE,
  source: 'apilint',
  message: 'workflowId is mutually exclusive with operationId and operationPath',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'missingFields',
  linterParams: [['operationId', 'operationPath']],
  marker: 'key',
  markerTarget: 'workflowId',
  conditions: [
    {
      function: 'missingField',
      params: ['workflowId'],
      negate: true,
    },
  ],
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default workflowIdMutuallyExclusiveLint;
