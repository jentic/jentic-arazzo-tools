import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const inputsTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_COMPONENTS_FIELD_INPUTS_TYPE,
  source: 'apilint',
  message: 'inputs must be an object',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['object'],
  marker: 'value',
  target: 'inputs',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default inputsTypeLint;
