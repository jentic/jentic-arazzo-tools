import { DiagnosticSeverity } from 'vscode-languageserver-types';

import ApilintCodes from '../../../codes.ts';
import { LinterMeta, ArazzoTargetSpecs } from '@speclynx/apidom-ls';


const conditionRegexValidLint: LinterMeta = {
  code: ApilintCodes.ARAZZO_CRITERION_FIELD_CONDITION_REGEX_VALID,
  source: 'apilint',
  message: 'Criterion "condition" must be a valid regular expression when type is "regex".',
  severity: DiagnosticSeverity.Error,
  linterFunction: 'apilintArazzoConditionRegexValid',
  linterParams: [],
  marker: 'value',
  target: 'condition',
  data: {},
  targetSpecs: [...ArazzoTargetSpecs.Arazzo],
};

export default conditionRegexValidLint;
