import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const parametersValuesTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_COMPONENTS_FIELD_PARAMETERS_VALUES_TYPE,
  source: 'apilint',
  message: 'parameters values must be Parameter Objects',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintChildrenOfElementsOrClasses',
  linterParams: [['parameter']],
  marker: 'key',
  target: 'parameters',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default parametersValuesTypeLint;
