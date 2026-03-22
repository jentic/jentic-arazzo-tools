import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const componentsTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SPEC_FIELD_COMPONENTS_TYPE,
  source: 'apilint',
  message: 'components must be an object',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintElementOrClass',
  linterParams: [['components']],
  marker: 'value',
  target: 'components',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default componentsTypeLint;
