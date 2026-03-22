import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const arazzoTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SPEC_FIELD_ARAZZO_TYPE,
  source: 'apilint',
  message: 'arazzo version must be a string',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['string'],
  marker: 'value',
  target: 'arazzo',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default arazzoTypeLint;
