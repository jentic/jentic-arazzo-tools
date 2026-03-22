import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const dependsOnResolvedLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_WORKFLOW_FIELD_DEPENDS_ON_RESOLVED,
  source: 'apilint',
  message: '"dependsOn" entries must reference existing workflow IDs.',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArazzoArrayValuesResolveToWorkflows',
  linterParams: [],
  marker: 'value',
  target: 'dependsOn',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default dependsOnResolvedLint;
