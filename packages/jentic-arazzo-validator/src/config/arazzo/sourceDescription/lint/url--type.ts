import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const urlTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SOURCE_DESCRIPTION_FIELD_URL_TYPE,
  source: 'apilint',
  message: 'url must be a string',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['string'],
  marker: 'value',
  target: 'url',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default urlTypeLint;
