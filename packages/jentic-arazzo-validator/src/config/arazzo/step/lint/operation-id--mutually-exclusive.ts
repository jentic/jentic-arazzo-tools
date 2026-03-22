import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const operationIdMutuallyExclusiveLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_OPERATION_ID_MUTUALLY_EXCLUSIVE,
  source: 'apilint',
  message: 'operationId is mutually exclusive with operationPath and workflowId',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'missingFields',
  linterParams: [['operationPath', 'workflowId']],
  marker: 'key',
  markerTarget: 'operationId',
  conditions: [
    {
      function: 'missingField',
      params: ['operationId'],
      negate: true,
    },
  ],
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default operationIdMutuallyExclusiveLint;
