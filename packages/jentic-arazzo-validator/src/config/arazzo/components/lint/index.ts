import inputsTypeLint from './inputs--type.ts';
import inputsValuesTypeLint from './inputs--values-type.ts';
import inputsKeysPatternLint from './inputs--keys-pattern.ts';
import parametersTypeLint from './parameters--type.ts';
import parametersValuesTypeLint from './parameters--values-type.ts';
import parametersKeysPatternLint from './parameters--keys-pattern.ts';
import successActionsTypeLint from './success-actions--type.ts';
import successActionsValuesTypeLint from './success-actions--values-type.ts';
import successActionsKeysPatternLint from './success-actions--keys-pattern.ts';
import failureActionsTypeLint from './failure-actions--type.ts';
import failureActionsValuesTypeLint from './failure-actions--values-type.ts';
import failureActionsKeysPatternLint from './failure-actions--keys-pattern.ts';
import allowedFieldsLint from './allowed-fields.ts';

const lints = [
  inputsTypeLint,
  inputsValuesTypeLint,
  inputsKeysPatternLint,
  parametersTypeLint,
  parametersValuesTypeLint,
  parametersKeysPatternLint,
  successActionsTypeLint,
  successActionsValuesTypeLint,
  successActionsKeysPatternLint,
  failureActionsTypeLint,
  failureActionsValuesTypeLint,
  failureActionsKeysPatternLint,
  allowedFieldsLint,
];

export default lints;
