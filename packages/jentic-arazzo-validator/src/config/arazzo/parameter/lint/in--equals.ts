import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const inEqualsLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_PARAMETER_FIELD_IN_EQUALS,
  source: 'apilint',
  message: "in must be one of: 'path', 'query', 'header', 'cookie'",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintValueOrArray',
  linterParams: [['path', 'query', 'header', 'cookie']],
  marker: 'value',
  target: 'in',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default inEqualsLint;
