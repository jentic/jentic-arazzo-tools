import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const typeEqualsLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_CRITERION_FIELD_TYPE_EQUALS,
  source: 'apilint',
  message: "type must be one of: 'simple', 'regex', 'jsonpath', 'xpath', or a Criterion Expression Type Object",
  severity: DiagnosticSeverity.Warning,
  linterFunction: 'apilintValueOrArray',
  linterParams: [['simple', 'regex', 'jsonpath', 'xpath']],
  marker: 'value',
  target: 'type',
  conditions: [
    {
      targets: [{ path: 'type' }],
      function: 'apilintType',
      params: ['string'],
    },
  ],
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default typeEqualsLint;
