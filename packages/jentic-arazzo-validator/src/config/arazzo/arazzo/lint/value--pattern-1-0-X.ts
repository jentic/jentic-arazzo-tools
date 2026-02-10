import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { LinterMeta } from '@speclynx/apidom-ls';

import ApilintCodes from '../../../codes.ts';
import { Arazzo10X } from '../../target-specs.ts';

const valuePattern1_0_XLint: LinterMeta = {
  code: ApilintCodes.ARAZZO1_ARAZZO_VALUE_PATTERN_1_0_X,
  source: 'apilint',
  message: "'arazzo' value must be one of 1.0.0, 1.0.1",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintValueRegex',
  linterParams: ['1\\.0\\.[01]{1}'],
  marker: 'value',
  data: {
    quickFix: [
      {
        message: "update to '1.0.0'",
        action: 'updateValue',
        functionParams: ['1.0.0'],
      },
      {
        message: "update to '1.0.1'",
        action: 'updateValue',
        functionParams: ['1.0.1'],
      },
    ],
  },
  targetSpecs: Arazzo10X,
};

export default valuePattern1_0_XLint;
