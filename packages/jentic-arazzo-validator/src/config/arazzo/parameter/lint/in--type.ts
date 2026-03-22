import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const inTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_PARAMETER_FIELD_IN_TYPE,
  source: 'apilint',
  message: 'in must be a string',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['string'],
  marker: 'value',
  target: 'in',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default inTypeLint;
