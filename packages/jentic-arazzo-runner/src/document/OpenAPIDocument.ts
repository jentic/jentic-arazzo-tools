import type { ParseResultElement } from '@jentic/arazzo-parser';

import APIDocument from './APIDocument.ts';
import type OpenAPIOperationIndex from './OpenAPIOperationIndex.ts';

/**
 * An OpenAPI document held by the document registry.
 * @public
 */
class OpenAPIDocument extends APIDocument {
  readonly type = 'openapi' as const;
  readonly operationIndex: OpenAPIOperationIndex;

  constructor(uri: string, parseResult: ParseResultElement, operationIndex: OpenAPIOperationIndex) {
    super(uri, parseResult);
    this.operationIndex = operationIndex;
  }

  /**
   * Type guard for OpenAPIDocument.
   */
  static is(doc: APIDocument): doc is OpenAPIDocument {
    return doc.type === 'openapi';
  }
}

export default OpenAPIDocument;
