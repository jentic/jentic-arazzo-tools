import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { LinterMeta } from '@speclynx/apidom-ls';

import ApilintCodes from '../../../codes.ts';
import { Arazzo1 } from '../../target-specs.ts';

const infoTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO1_ARAZZO_SPECIFICATION_FIELD_INFO_TYPE,
  source: 'apilint',
  message: 'info must be an object',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintElementOrClass',
  linterParams: [['info']],
  marker: 'value',
  target: 'info',
  data: {},
  targetSpecs: Arazzo1,
};

export default infoTypeLint;
