import nameRequiredLint from './name--required.ts';
import nameTypeLint from './name--type.ts';
import inTypeLint from './in--type.ts';
import inEqualsLint from './in--equals.ts';
import valueRequiredLint from './value--required.ts';
import valueRuntimeExpressionLint from './value--runtime-expression.ts';
import parameterUniqueLint from './unique.ts';
import allowedFieldsLint from './allowed-fields.ts';

const lints = [
  nameRequiredLint,
  nameTypeLint,
  parameterUniqueLint,
  inTypeLint,
  inEqualsLint,
  valueRequiredLint,
  valueRuntimeExpressionLint,
  allowedFieldsLint,
];

export default lints;
