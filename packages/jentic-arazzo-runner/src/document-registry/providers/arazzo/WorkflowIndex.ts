/**
 * Unique identifier of an Arazzo workflow.
 * @public
 */
export type WorkflowId = string;

/**
 * JSON Pointer (RFC 6901) to a workflow in an Arazzo document.
 * e.g., `/workflows/0`
 * @public
 */
export type JSONPointer = string;

/**
 * Index mapping workflowId to its JSON Pointer in an Arazzo document.
 * @public
 */
class WorkflowIndex extends Map<WorkflowId, JSONPointer> {}

export default WorkflowIndex;
