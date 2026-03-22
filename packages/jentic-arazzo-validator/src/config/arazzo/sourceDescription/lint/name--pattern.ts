import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const namePatternLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SOURCE_DESCRIPTION_FIELD_NAME_PATTERN,
  source: 'apilint',
  message: 'name must match the pattern [A-Za-z0-9_\\-]+',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintValueRegex',
  linterParams: ['^[A-Za-z0-9_\\-]+$'],
  marker: 'value',
  target: 'name',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default namePatternLint;
