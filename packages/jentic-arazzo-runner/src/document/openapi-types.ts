import {
  type PathItemElement as PathItemElement2,
  type OperationElement as OperationElement2,
} from '@speclynx/apidom-ns-openapi-2';
import {
  type PathItemElement as PathItemElement30,
  type OperationElement as OperationElement30,
} from '@speclynx/apidom-ns-openapi-3-0';
import {
  type PathItemElement as PathItemElement31,
  type OperationElement as OperationElement31,
} from '@speclynx/apidom-ns-openapi-3-1';

/**
 * Union of PathItemElement across all supported OpenAPI versions.
 * @public
 */
export type OpenAPIPathItemElement = PathItemElement2 | PathItemElement30 | PathItemElement31;

/**
 * Union of OperationElement across all supported OpenAPI versions.
 * @public
 */
export type OpenAPIOperationElement = OperationElement2 | OperationElement30 | OperationElement31;
