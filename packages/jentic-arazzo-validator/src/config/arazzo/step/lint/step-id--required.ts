import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const stepIdRequiredLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_STEP_ID_REQUIRED,
  source: 'apilint',
  message: "should always have a 'stepId'",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'hasRequiredField',
  linterParams: ['stepId'],
  marker: 'key',
  data: {
    quickFix: [
      {
        message: "add 'stepId' field",
        action: 'addChild',
        snippetYaml: 'stepId: \n  ',
        snippetJson: '"stepId": "",\n    ',
      },
    ],
  },
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default stepIdRequiredLint;
