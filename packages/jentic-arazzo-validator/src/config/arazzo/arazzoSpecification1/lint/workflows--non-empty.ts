import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const workflowsNonEmptyLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SPEC_FIELD_WORKFLOWS_NON_EMPTY,
  source: 'apilint',
  message: 'workflows must have at least one entry',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArrayNotEmpty',
  marker: 'key',
  target: 'workflows',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default workflowsNonEmptyLint;
