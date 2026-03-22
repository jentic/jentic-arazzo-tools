import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const targetTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_PAYLOAD_REPLACEMENT_FIELD_TARGET_TYPE,
  source: 'apilint',
  message: 'target must be a string (JSON Pointer or XPath Expression)',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['string'],
  marker: 'value',
  target: 'target',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default targetTypeLint;
