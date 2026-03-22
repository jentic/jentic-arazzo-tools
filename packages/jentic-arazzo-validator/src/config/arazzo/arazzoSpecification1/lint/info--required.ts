import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const infoRequiredLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SPEC_FIELD_INFO_REQUIRED,
  source: 'apilint',
  message: "should always have an 'info' object",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'hasRequiredField',
  linterParams: ['info'],
  marker: 'key',
  data: {
    quickFix: [
      {
        message: "add 'info' field",
        action: 'addChild',
        snippetYaml: 'info: \n  title: \n  version: \n  ',
        snippetJson: '"info": {},\n    ',
      },
    ],
  },
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default infoRequiredLint;
