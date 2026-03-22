import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const referenceTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_REUSABLE_FIELD_REFERENCE_TYPE,
  source: 'apilint',
  message: 'reference must be a string (Runtime Expression)',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['string'],
  marker: 'value',
  target: 'reference',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default referenceTypeLint;
