import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const typeRequiredLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_TYPE_REQUIRED,
  source: 'apilint',
  message: "should always have a 'type'",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'hasRequiredField',
  linterParams: ['type'],
  marker: 'key',
  data: {
    quickFix: [
      {
        message: "add 'type' field",
        action: 'addChild',
        snippetYaml: 'type: jsonpath\n  ',
        snippetJson: '"type": "jsonpath",\n    ',
      },
    ],
  },
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default typeRequiredLint;
