import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const failureActionsTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_WORKFLOW_FIELD_FAILURE_ACTIONS_TYPE,
  source: 'apilint',
  message: 'failureActions must be an array of Failure Action or Reusable Objects',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArrayOfElementsOrClasses',
  linterParams: [['failureAction', 'reusable']],
  marker: 'key',
  target: 'failureActions',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default failureActionsTypeLint;
