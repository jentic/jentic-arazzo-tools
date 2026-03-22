import nameRequiredLint from './name--required.ts';
import nameTypeLint from './name--type.ts';
import typeRequiredLint from './type--required.ts';
import typeTypeLint from './type--type.ts';
import typeEqualsLint from './type--equals.ts';
import workflowIdTypeLint from './workflow-id--type.ts';
import stepIdTypeLint from './step-id--type.ts';
import retryAfterTypeLint from './retry-after--type.ts';
import retryAfterNonNegativeLint from './retry-after--non-negative.ts';
import retryLimitTypeLint from './retry-limit--type.ts';
import retryLimitNonNegativeLint from './retry-limit--non-negative.ts';
import criteriaTypeLint from './criteria--type.ts';
import workflowIdMutuallyExclusiveLint from './workflow-id--mutually-exclusive.ts';
import stepIdMutuallyExclusiveLint from './step-id--mutually-exclusive.ts';
import workflowIdResolvedLint from './workflow-id--resolved.ts';
import stepIdResolvedLint from './step-id--resolved.ts';
import retryAfterOnlyRetryLint from './retry-after--only-retry.ts';
import retryLimitOnlyRetryLint from './retry-limit--only-retry.ts';
import nameUniqueLint from './name--unique.ts';
import allowedFieldsLint from './allowed-fields.ts';

const lints = [
  nameRequiredLint,
  nameTypeLint,
  nameUniqueLint,
  typeRequiredLint,
  typeTypeLint,
  typeEqualsLint,
  workflowIdTypeLint,
  stepIdTypeLint,
  workflowIdMutuallyExclusiveLint,
  stepIdMutuallyExclusiveLint,
  workflowIdResolvedLint,
  stepIdResolvedLint,
  retryAfterTypeLint,
  retryAfterNonNegativeLint,
  retryLimitTypeLint,
  retryLimitNonNegativeLint,
  retryAfterOnlyRetryLint,
  retryLimitOnlyRetryLint,
  criteriaTypeLint,
  allowedFieldsLint,
];

export default lints;
