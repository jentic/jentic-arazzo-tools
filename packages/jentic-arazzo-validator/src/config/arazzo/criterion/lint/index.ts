import conditionRequiredLint from './condition--required.ts';
import conditionTypeLint from './condition--type.ts';
import conditionRegexValidLint from './condition--regex-valid.ts';
import contextTypeLint from './context--type.ts';
import contextRuntimeExpressionLint from './context--runtime-expression.ts';
import typeEqualsLint from './type--equals.ts';
import contextRequiredWhenTypeLint from './context--required-when-type.ts';
import allowedFieldsLint from './allowed-fields.ts';

const lints = [
  conditionRequiredLint,
  conditionTypeLint,
  conditionRegexValidLint,
  contextTypeLint,
  contextRuntimeExpressionLint,
  typeEqualsLint,
  contextRequiredWhenTypeLint,
  allowedFieldsLint,
];

export default lints;
