import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const sourceDescriptionsNonEmptyLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SPEC_FIELD_SOURCE_DESCRIPTIONS_NON_EMPTY,
  source: 'apilint',
  message: 'sourceDescriptions must have at least one entry',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArrayNotEmpty',
  marker: 'key',
  target: 'sourceDescriptions',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default sourceDescriptionsNonEmptyLint;
