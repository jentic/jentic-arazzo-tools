import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const typeEqualsLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SOURCE_DESCRIPTION_FIELD_TYPE_EQUALS,
  source: 'apilint',
  message: "type must be one of: 'openapi', 'arazzo'",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintValueOrArray',
  linterParams: [['openapi', 'arazzo']],
  marker: 'value',
  target: 'type',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default typeEqualsLint;
