import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const descriptionRecommendedLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_DESCRIPTION_RECOMMENDED,
  source: 'apilint',
  message: "Step 'description' should be present and non-empty string.",
  severity: DiagnosticSeverity.Warning,
  linterFunction: 'hasRequiredField',
  linterParams: ['description'],
  marker: 'key',
  data: {
    quickFix: [
      {
        message: "add 'description' field",
        action: 'addChild',
        snippetYaml: 'description: \n  ',
        snippetJson: '"description": "",\n    ',
      },
    ],
  },
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default descriptionRecommendedLint;
