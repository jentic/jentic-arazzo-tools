import type { ParseResultElement } from '@jentic/arazzo-parser';

import APIDocument from './Document.ts';
import type OperationIndex from '../providers/openapi/OperationIndex.ts';

/**
 * An OpenAPI document held by the document registry.
 * @public
 */
class OpenAPIDocument extends APIDocument {
  readonly type = 'openapi' as const;
  readonly operationIndex: OperationIndex;

  constructor(uri: string, parseResult: ParseResultElement, operationIndex: OperationIndex) {
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
