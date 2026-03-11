/**
 * Unique identifier of an OpenAPI operation.
 * @public
 */
export type OperationId = string;

/**
 * JSON Pointer (RFC 6901) to an operation in an OpenAPI document.
 * e.g., `/paths/~1pets/get`
 * @public
 */
export type JSONPointer = string;

/**
 * Index mapping operationId to its JSON Pointer in an OpenAPI document.
 *
 * Only operations with an operationId are indexed; operations without one
 * are accessed directly via operationPath from the Arazzo step.
 * @public
 */
class OperationIndex extends Map<OperationId, JSONPointer> {}

export default OperationIndex;
