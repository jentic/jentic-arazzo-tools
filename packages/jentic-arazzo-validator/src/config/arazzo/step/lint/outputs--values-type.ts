import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const outputsValuesTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_OUTPUTS_VALUES_TYPE,
  source: 'apilint',
  message: 'output values must be strings (Runtime Expressions)',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintChildrenOfType',
  linterParams: ['string'],
  marker: 'value',
  target: 'outputs',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default outputsValuesTypeLint;
