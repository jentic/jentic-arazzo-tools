import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const arazzoPatternLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SPEC_FIELD_ARAZZO_PATTERN,
  source: 'apilint',
  message: 'arazzo version must match the pattern 1.0.x',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintValueRegex',
  linterParams: ['^1\\.0\\.\\d+(-.+)?$'],
  marker: 'value',
  target: 'arazzo',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default arazzoPatternLint;
