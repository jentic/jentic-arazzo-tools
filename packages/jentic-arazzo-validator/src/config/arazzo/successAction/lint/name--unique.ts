import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const nameUniqueLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_SUCCESS_ACTIONS_NAMES_UNIQUE,
  source: 'apilint',
  message: "Every success action must have a unique 'name'.",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintSiblingUniqueValue',
  linterParams: ['name'],
  marker: 'value',
  markerTarget: 'name',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default nameUniqueLint;
