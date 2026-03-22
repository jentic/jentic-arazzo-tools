import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const workflowsRequiredLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SPEC_FIELD_WORKFLOWS_REQUIRED,
  source: 'apilint',
  message: "should always have a 'workflows' list",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'hasRequiredField',
  linterParams: ['workflows'],
  marker: 'key',
  data: {
    quickFix: [
      {
        message: "add 'workflows' field",
        action: 'addChild',
        snippetYaml: 'workflows: \n  - workflowId: \n    steps: \n  ',
        snippetJson: '"workflows": [],\n    ',
      },
    ],
  },
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default workflowsRequiredLint;
