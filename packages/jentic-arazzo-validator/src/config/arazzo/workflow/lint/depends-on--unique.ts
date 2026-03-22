import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const dependsOnUniqueLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_WORKFLOW_FIELD_DEPENDS_ON_UNIQUE,
  source: 'apilint',
  message: "'dependsOn' entries must be unique.",
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArrayUniqueValues',
  target: 'dependsOn',
  marker: 'value',
  markerTarget: 'dependsOn',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default dependsOnUniqueLint;
