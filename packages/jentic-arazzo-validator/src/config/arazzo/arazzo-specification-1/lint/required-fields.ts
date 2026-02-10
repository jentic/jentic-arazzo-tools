import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { LinterMeta } from '@speclynx/apidom-ls';

import ApilintCodes from '../../../codes.ts';

import { Arazzo1 } from '../../target-specs.ts';

const requiredFieldsLint: LinterMeta = {
  code: ApilintCodes.ARAZZO1_ARAZZO_SPECIFICATION_REQUIRED_FIELDS,
  source: 'apilint',
  message:
    'Arazzo Specification Object must contain following fields: info, sourceDescriptions, workflows',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'hasRequiredField',
  linterParams: ['info', 'sourceDescriptions', 'workflows'],
  marker: 'key',
  conditions: [
    {
      targets: [{ path: 'root' }],
      function: 'missingFields',
      params: [['info', 'sourceDescriptions', 'workflows']],
    },
  ],
  data: {
    quickFix: [
      {
        message: "add 'info' section",
        action: 'addChild',
        snippetYaml: 'info: \n  \n',
        snippetJson: '"info": {\n  \n  },\n',
      },
      {
        message: "add 'sourceDescriptions' section",
        action: 'addChild',
        snippetYaml: 'sourceDescriptions: \n  \n',
        snippetJson: '"sourceDescriptions": {\n  \n  },\n',
      },
      {
        message: "add 'workflows' section",
        action: 'addChild',
        snippetYaml: 'workflows: \n  \n',
        snippetJson: '"workflows": {\n  \n  },\n',
      },
    ],
  },
  targetSpecs: Arazzo1,
};

export default requiredFieldsLint;
