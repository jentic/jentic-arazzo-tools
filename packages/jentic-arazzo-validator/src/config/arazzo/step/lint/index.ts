import stepIdRequiredLint from './step-id--required.ts';
import stepIdTypeLint from './step-id--type.ts';
import stepIdPatternLint from './step-id--pattern.ts';
import descriptionTypeLint from './description--type.ts';
import operationIdTypeLint from './operation-id--type.ts';
import operationPathTypeLint from './operation-path--type.ts';
import workflowIdTypeLint from './workflow-id--type.ts';
import requestBodyTypeLint from './request-body--type.ts';
import successCriteriaTypeLint from './success-criteria--type.ts';
import onSuccessTypeLint from './on-success--type.ts';
import onFailureTypeLint from './on-failure--type.ts';
import outputsTypeLint from './outputs--type.ts';
import outputsKeysPatternLint from './outputs--keys-pattern.ts';
import outputsValuesTypeLint from './outputs--values-type.ts';
import parametersTypeLint from './parameters--type.ts';
import operationIdMutuallyExclusiveLint from './operation-id--mutually-exclusive.ts';
import operationPathMutuallyExclusiveLint from './operation-path--mutually-exclusive.ts';
import workflowIdMutuallyExclusiveLint from './workflow-id--mutually-exclusive.ts';
import descriptionRecommendedLint from './description--recommended.ts';
import operationPathPreferOperationIdLint from './operation-path--prefer-operation-id.ts';
import stepIdUniqueLint from './step-id--unique.ts';
import outputsNamesUniqueLint from './outputs--names-unique.ts';
import outputsValuesRuntimeExpressionLint from './outputs--values-runtime-expression.ts';
import workflowIdResolvedLint from './workflow-id--resolved.ts';
import allowedFieldsLint from './allowed-fields.ts';

const lints = [
  stepIdRequiredLint,
  stepIdTypeLint,
  stepIdPatternLint,
  stepIdUniqueLint,
  descriptionTypeLint,
  descriptionRecommendedLint,
  operationIdTypeLint,
  operationPathTypeLint,
  workflowIdTypeLint,
  operationIdMutuallyExclusiveLint,
  operationPathMutuallyExclusiveLint,
  workflowIdMutuallyExclusiveLint,
  operationPathPreferOperationIdLint,
  workflowIdResolvedLint,
  requestBodyTypeLint,
  successCriteriaTypeLint,
  onSuccessTypeLint,
  onFailureTypeLint,
  outputsTypeLint,
  outputsNamesUniqueLint,
  outputsValuesRuntimeExpressionLint,
  outputsKeysPatternLint,
  outputsValuesTypeLint,
  parametersTypeLint,
  allowedFieldsLint,
];

export default lints;
