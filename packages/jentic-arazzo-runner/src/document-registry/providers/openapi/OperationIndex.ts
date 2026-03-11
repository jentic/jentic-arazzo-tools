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
 * Only used when an Arazzo step references an operation by `operationId`.
 * When a step uses `operationPath` (a JSON Pointer), the index is bypassed
 * and the pointer is used directly to locate the operation.
 *
 * Only operations with an operationId are indexed; operations without one
 * are only reachable via `operationPath`.
 * @public
 */
class OperationIndex extends Map<OperationId, JSONPointer> {}

export default OperationIndex;
