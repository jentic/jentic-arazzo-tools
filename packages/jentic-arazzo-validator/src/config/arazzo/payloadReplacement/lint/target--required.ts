import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const targetRequiredLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_PAYLOAD_REPLACEMENT_FIELD_TARGET_REQUIRED,
  source: 'apilint',
  message: "should always have a 'target'",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'hasRequiredField',
  linterParams: ['target'],
  marker: 'key',
  data: {
    quickFix: [
      {
        message: "add 'target' field",
        action: 'addChild',
        snippetYaml: 'target: \n  ',
        snippetJson: '"target": "",\n    ',
      },
    ],
  },
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default targetRequiredLint;
