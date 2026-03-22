import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const inputsValuesTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_COMPONENTS_FIELD_INPUTS_VALUES_TYPE,
  source: 'apilint',
  message: 'inputs values must be JSON Schema Objects',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintChildrenOfElementsOrClasses',
  linterParams: [['JSONSchema']],
  marker: 'key',
  target: 'inputs',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default inputsValuesTypeLint;
