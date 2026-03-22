import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const contentTypeTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_REQUEST_BODY_FIELD_CONTENT_TYPE_TYPE,
  source: 'apilint',
  message: 'contentType must be a string',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['string'],
  marker: 'value',
  target: 'contentType',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default contentTypeTypeLint;
