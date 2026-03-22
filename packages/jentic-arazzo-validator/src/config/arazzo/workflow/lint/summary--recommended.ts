import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const summaryRecommendedLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_WORKFLOW_FIELD_SUMMARY_RECOMMENDED,
  source: 'apilint',
  message: "Workflow 'summary' is recommended to be present and a non-empty string.",
  severity: DiagnosticSeverity.Hint,
  linterFunction: 'hasRequiredField',
  linterParams: ['summary'],
  marker: 'key',
  data: {
    quickFix: [
      {
        message: "add 'summary' field",
        action: 'addChild',
        snippetYaml: 'summary: \n  ',
        snippetJson: '"summary": "",\n    ',
      },
    ],
  },
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default summaryRecommendedLint;
