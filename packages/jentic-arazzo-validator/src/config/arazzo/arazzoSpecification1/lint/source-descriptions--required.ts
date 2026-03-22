import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const sourceDescriptionsRequiredLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SPEC_FIELD_SOURCE_DESCRIPTIONS_REQUIRED,
  source: 'apilint',
  message: "should always have a 'sourceDescriptions' list",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'hasRequiredField',
  linterParams: ['sourceDescriptions'],
  marker: 'key',
  data: {
    quickFix: [
      {
        message: "add 'sourceDescriptions' field",
        action: 'addChild',
        snippetYaml: 'sourceDescriptions: \n  - name: \n    url: \n  ',
        snippetJson: '"sourceDescriptions": [],\n    ',
      },
    ],
  },
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default sourceDescriptionsRequiredLint;
