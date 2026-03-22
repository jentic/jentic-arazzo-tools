import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const valueTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_REUSABLE_FIELD_VALUE_TYPE,
  source: 'apilint',
  message: 'value must be a string',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['string'],
  marker: 'value',
  target: 'value',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default valueTypeLint;
