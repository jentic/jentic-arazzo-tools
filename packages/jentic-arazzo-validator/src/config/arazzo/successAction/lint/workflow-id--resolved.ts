import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const workflowIdResolvedLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SUCCESS_ACTION_FIELD_WORKFLOW_ID_RESOLVED,
  source: 'apilint',
  message: 'Success action "workflowId" must reference an existing workflow.',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArazzoWorkflowIdResolved',
  linterParams: [],
  marker: 'value',
  target: 'workflowId',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default workflowIdResolvedLint;
