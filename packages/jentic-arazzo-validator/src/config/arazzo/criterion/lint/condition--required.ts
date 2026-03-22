import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const conditionRequiredLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_CRITERION_FIELD_CONDITION_REQUIRED,
  source: 'apilint',
  message: "should always have a 'condition'",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'hasRequiredField',
  linterParams: ['condition'],
  marker: 'key',
  data: {
    quickFix: [
      {
        message: "add 'condition' field",
        action: 'addChild',
        snippetYaml: 'condition: \n  ',
        snippetJson: '"condition": "",\n    ',
      },
    ],
  },
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default conditionRequiredLint;
