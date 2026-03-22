import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const parameterUniqueLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_STEP_FIELD_PARAMETERS_UNIQUE,
  source: 'apilint',
  message: "Parameters must be unique by 'name' and 'in' combination.",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintSiblingUniqueCompositeValue',
  linterParams: [['name', 'in']],
  marker: 'key',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default parameterUniqueLint;
