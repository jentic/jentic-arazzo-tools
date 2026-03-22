import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const typeRequiredLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SUCCESS_ACTION_FIELD_TYPE_REQUIRED,
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
        snippetYaml: 'type: end\n  ',
        snippetJson: '"type": "end",\n    ',
      },
    ],
  },
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default typeRequiredLint;
