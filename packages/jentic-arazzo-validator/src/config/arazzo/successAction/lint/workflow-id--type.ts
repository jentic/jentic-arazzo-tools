import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const workflowIdTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SUCCESS_ACTION_FIELD_WORKFLOW_ID_TYPE,
  source: 'apilint',
  message: 'workflowId must be a string',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['string'],
  marker: 'value',
  target: 'workflowId',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default workflowIdTypeLint;
