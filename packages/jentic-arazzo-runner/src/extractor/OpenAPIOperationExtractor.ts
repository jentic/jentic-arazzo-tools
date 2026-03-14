import { evaluate, parse, type JSONPointer } from '@speclynx/apidom-json-pointer';

import type { OpenAPIOperationElement } from '../document/openapi-types.ts';
import type OpenAPIDocument from '../document/OpenAPIDocument.ts';
import type { OperationId } from '../document/OpenAPIOperationIndex.ts';
import OpenAPIOperationNotFoundError from '../errors/OpenAPIOperationNotFoundError.ts';

/**
 * Extracts an operation from an OpenAPI document.
 *
 * Locates the operation by operationId or operationPath (JSON Pointer)
 * and attaches metadata (pointer, method, path) to the element.
 * The extracted operation is not dereferenced or normalized;
 * use OpenAPIOperationNormalizer for that.
 * @public
 */
class OpenAPIOperationExtractor {
  /**
   * Extracts an operation by operationId.
   */
  extract(document: OpenAPIDocument, operationId: OperationId): OpenAPIOperationElement {
    const pointer = document.operationIndex.get(operationId);
    if (pointer === undefined) {
      throw new OpenAPIOperationNotFoundError(
        `Operation "${operationId}" not found in OpenAPI document at "${document.uri}"`,
        { operationId, uri: document.uri },
      );
    }

    return this.extractByPointer(document, pointer);
  }

  /**
   * Extracts an operation by JSON Pointer (operationPath).
   */
  extractByPointer(document: OpenAPIDocument, pointer: JSONPointer): OpenAPIOperationElement {
    const [, path, method] = parse(pointer).tree!;

    const operation = evaluate<OpenAPIOperationElement>(document.parseResult.api, pointer);
    if (operation?.element !== 'operation') {
      throw new OpenAPIOperationNotFoundError(
        `Pointer "${pointer}" does not reference an operation in OpenAPI document at "${document.uri}"`,
        { pointer, uri: document.uri },
      );
    }

    // attach metadata for downstream consumers
    operation.meta.set('pointer', pointer);
    operation.meta.set('http-method', method);
    operation.meta.set('path', path);

    return operation;
  }
}

export default OpenAPIOperationExtractor;
