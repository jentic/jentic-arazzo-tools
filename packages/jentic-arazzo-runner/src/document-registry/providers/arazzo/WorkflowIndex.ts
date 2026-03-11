import { type JSONPointer } from '@speclynx/apidom-json-pointer';

/**
 * Unique identifier of an Arazzo workflow.
 * @public
 */
export type WorkflowId = string;

/**
 * Index mapping workflowId to its JSON Pointer in an Arazzo document.
 * @public
 */
class WorkflowIndex extends Map<WorkflowId, JSONPointer> {}

export default WorkflowIndex;
