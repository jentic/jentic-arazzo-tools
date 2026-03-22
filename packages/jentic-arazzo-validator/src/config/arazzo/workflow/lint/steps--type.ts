import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const stepsTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_WORKFLOW_FIELD_STEPS_TYPE,
  source: 'apilint',
  message: 'steps must be an array of Step Objects',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArrayOfElementsOrClasses',
  linterParams: [['step']],
  marker: 'key',
  target: 'steps',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default stepsTypeLint;
