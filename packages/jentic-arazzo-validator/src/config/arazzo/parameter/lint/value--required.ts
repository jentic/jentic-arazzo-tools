import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const valueRequiredLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_PARAMETER_FIELD_VALUE_REQUIRED,
  source: 'apilint',
  message: "should always have a 'value'",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'hasRequiredField',
  linterParams: ['value'],
  marker: 'key',
  data: {
    quickFix: [
      {
        message: "add 'value' field",
        action: 'addChild',
        snippetYaml: 'value: \n  ',
        snippetJson: '"value": "",\n    ',
      },
    ],
  },
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default valueRequiredLint;
