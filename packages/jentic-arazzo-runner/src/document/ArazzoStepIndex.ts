import { type JSONPointer } from '@speclynx/apidom-json-pointer';

/**
 * Unique identifier of an Arazzo step within a workflow.
 * @public
 */
export type StepId = string;

/**
 * Index mapping stepId to its JSON Pointer within a workflow.
 * @public
 */
class ArazzoStepIndex extends Map<StepId, JSONPointer> {}

export default ArazzoStepIndex;
