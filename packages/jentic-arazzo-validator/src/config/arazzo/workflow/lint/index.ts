import workflowIdRequiredLint from './workflow-id--required.ts';
import workflowIdTypeLint from './workflow-id--type.ts';
import workflowIdPatternLint from './workflow-id--pattern.ts';
import summaryTypeLint from './summary--type.ts';
import descriptionTypeLint from './description--type.ts';
import inputsTypeLint from './inputs--type.ts';
import stepsRequiredLint from './steps--required.ts';
import stepsTypeLint from './steps--type.ts';
import stepsNonEmptyLint from './steps--non-empty.ts';
import dependsOnTypeLint from './depends-on--type.ts';
import successActionsTypeLint from './success-actions--type.ts';
import failureActionsTypeLint from './failure-actions--type.ts';
import outputsTypeLint from './outputs--type.ts';
import outputsKeysPatternLint from './outputs--keys-pattern.ts';
import outputsValuesTypeLint from './outputs--values-type.ts';
import parametersTypeLint from './parameters--type.ts';
import descriptionRecommendedLint from './description--recommended.ts';
import summaryRecommendedLint from './summary--recommended.ts';
import workflowIdUniqueLint from './workflow-id--unique.ts';
import dependsOnUniqueLint from './depends-on--unique.ts';
import dependsOnResolvedLint from './depends-on--resolved.ts';
import outputsNamesUniqueLint from './outputs--names-unique.ts';
import outputsValuesRuntimeExpressionLint from './outputs--values-runtime-expression.ts';
import allowedFieldsLint from './allowed-fields.ts';

const lints = [
  workflowIdRequiredLint,
  workflowIdTypeLint,
  workflowIdPatternLint,
  workflowIdUniqueLint,
  summaryTypeLint,
  summaryRecommendedLint,
  descriptionTypeLint,
  descriptionRecommendedLint,
  inputsTypeLint,
  stepsRequiredLint,
  stepsTypeLint,
  stepsNonEmptyLint,
  dependsOnTypeLint,
  dependsOnUniqueLint,
  dependsOnResolvedLint,
  successActionsTypeLint,
  failureActionsTypeLint,
  outputsTypeLint,
  outputsNamesUniqueLint,
  outputsValuesRuntimeExpressionLint,
  outputsKeysPatternLint,
  outputsValuesTypeLint,
  parametersTypeLint,
  allowedFieldsLint,
];

export default lints;
