import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const stepsRequiredLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_WORKFLOW_FIELD_STEPS_REQUIRED,
  source: 'apilint',
  message: "should always have a 'steps' list",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'hasRequiredField',
  linterParams: ['steps'],
  marker: 'key',
  data: {
    quickFix: [
      {
        message: "add 'steps' field",
        action: 'addChild',
        snippetYaml: 'steps: \n  - stepId: \n  ',
        snippetJson: '"steps": [],\n    ',
      },
    ],
  },
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default stepsRequiredLint;
