import { evaluate, parse, type JSONPointer } from '@speclynx/apidom-json-pointer';

import type { OpenAPIOperationElement } from '../document/openapi-types.ts';
import type OpenAPIDocument from '../document/OpenAPIDocument.ts';
import type { OperationId } from '../document/OpenAPIOperationIndex.ts';
import ExtractionError from '../errors/ExtractionError.ts';

/**
 * Extracts an operation from an OpenAPI document.
 *
 * Locates the operation by operationId or operationPath (JSON Pointer)
 * and attaches metadata (pointer, method, path) to the element.
 * The extracted operation is not dereferenced or normalized.
 * @public
 */
class OpenAPIOperationExtractor {
  /**
   * Extracts an operation by operationId.
   */
  extract(document: OpenAPIDocument, operationId: OperationId): OpenAPIOperationElement {
    const pointer = document.operationIndex.get(operationId);
    if (pointer === undefined) {
      throw new ExtractionError(
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
    let operation: OpenAPIOperationElement;
    let tokens: string[];

    try {
      tokens = parse(pointer).tree!;
    } catch (error: unknown) {
      throw new ExtractionError(`Failed to parse pointer "${pointer}"`, {
        cause: error,
        pointer,
        uri: document.uri,
      });
    }

    if (tokens.length !== 3 || tokens[0] !== 'paths') {
      throw new ExtractionError(
        `Invalid operation pointer "${pointer}": expected /paths/{path}/{method}`,
        { pointer, uri: document.uri },
      );
    }

    try {
      operation = evaluate<OpenAPIOperationElement>(document.parseResult.api, pointer);
    } catch (error: unknown) {
      throw new ExtractionError(
        `Failed to evaluate pointer "${pointer}" in OpenAPI document at "${document.uri}"`,
        { cause: error, pointer, uri: document.uri },
      );
    }

    if (operation?.element !== 'operation') {
      throw new ExtractionError(
        `Pointer "${pointer}" does not reference an operation in OpenAPI document at "${document.uri}"`,
        { pointer, uri: document.uri },
      );
    }

    // attach metadata for downstream consumers
    operation.meta.set('pointer', pointer);
    operation.meta.set('http-method', tokens[2]);
    operation.meta.set('path', tokens[1]);

    return operation;
  }
}

export default OpenAPIOperationExtractor;
