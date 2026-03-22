import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const failureActionsValuesTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_COMPONENTS_FIELD_FAILURE_ACTIONS_VALUES_TYPE,
  source: 'apilint',
  message: 'failureActions values must be Failure Action Objects',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintChildrenOfElementsOrClasses',
  linterParams: [['failureAction']],
  marker: 'key',
  target: 'failureActions',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default failureActionsValuesTypeLint;
