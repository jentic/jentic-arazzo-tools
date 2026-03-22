import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const sourceDescriptionsTypeLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_SPEC_FIELD_SOURCE_DESCRIPTIONS_TYPE,
  source: 'apilint',
  message: 'sourceDescriptions must be an array of Source Description Objects',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArrayOfElementsOrClasses',
  linterParams: [['sourceDescription']],
  marker: 'key',
  target: 'sourceDescriptions',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default sourceDescriptionsTypeLint;
