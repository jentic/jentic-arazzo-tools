import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const stepIdUniqueLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_WORKFLOW_FIELD_STEP_ID_UNIQUE,
  source: 'apilint',
  message: "Every step must have a unique 'stepId' within a workflow.",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintSiblingUniqueValue',
  linterParams: ['stepId'],
  marker: 'value',
  markerTarget: 'stepId',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default stepIdUniqueLint;
