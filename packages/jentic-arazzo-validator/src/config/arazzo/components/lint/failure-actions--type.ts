import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const failureActionsTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_COMPONENTS_FIELD_FAILURE_ACTIONS_TYPE,
  source: 'apilint',
  message: 'failureActions must be an object',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['object'],
  marker: 'value',
  target: 'failureActions',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default failureActionsTypeLint;
