import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const successActionsTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_COMPONENTS_FIELD_SUCCESS_ACTIONS_TYPE,
  source: 'apilint',
  message: 'successActions must be an object',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintType',
  linterParams: ['object'],
  marker: 'value',
  target: 'successActions',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default successActionsTypeLint;
