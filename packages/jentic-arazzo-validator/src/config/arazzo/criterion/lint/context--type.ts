import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const contextTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_CRITERION_FIELD_CONTEXT_TYPE,
  source: 'apilint',
  message: 'context must be a string (Runtime Expression)',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['string'],
  marker: 'value',
  target: 'context',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default contextTypeLint;
