import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { LinterMeta } from '@speclynx/apidom-ls';

import ApilintCodes from '../../../codes.ts';
import { Arazzo1 } from '../../target-specs.ts';

const infoRequiredLint: LinterMeta = {
  code: ApilintCodes.ARAZZO1_ARAZZO_SPECIFICATION_FIELD_INFO_REQUIRED,
  source: 'apilint',
  message: "should always have a 'info' section",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'hasRequiredField',
  linterParams: ['info'],
  marker: 'key',
  data: {
    quickFix: [
      {
        message: "add 'info' section",
        action: 'addChild',
        snippetYaml: 'info: \n  \n',
        snippetJson: '"info": {\n  \n  },\n',
      },
    ],
  },
  targetSpecs: Arazzo1,
};

export default infoRequiredLint;
