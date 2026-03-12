import { type JSONPointer } from '@speclynx/apidom-json-pointer';

/**
 * Unique identifier of an OpenAPI operation.
 * @public
 */
export type OperationId = string;

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
class OpenAPIOperationIndex extends Map<OperationId, JSONPointer> {}

export default OpenAPIOperationIndex;
