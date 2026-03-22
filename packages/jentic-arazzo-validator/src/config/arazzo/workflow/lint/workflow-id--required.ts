import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const workflowIdRequiredLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_WORKFLOW_FIELD_WORKFLOW_ID_REQUIRED,
  source: 'apilint',
  message: "should always have a 'workflowId'",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'hasRequiredField',
  linterParams: ['workflowId'],
  marker: 'key',
  data: {
    quickFix: [
      {
        message: "add 'workflowId' field",
        action: 'addChild',
        snippetYaml: 'workflowId: \n  ',
        snippetJson: '"workflowId": "",\n    ',
      },
    ],
  },
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default workflowIdRequiredLint;
