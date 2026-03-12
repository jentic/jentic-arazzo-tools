import type { ParseResultElement } from '@jentic/arazzo-parser';

/**
 * Base document held by the document registry.
 * @public
 */
abstract class APIDocument {
  abstract readonly type: string;
  readonly uri: string;
  readonly parseResult: ParseResultElement;

  protected constructor(uri: string, parseResult: ParseResultElement) {
    this.uri = uri;
    this.parseResult = parseResult;
  }
}

export default APIDocument;
