import type { ParseResultElement } from '@jentic/arazzo-parser';
import { toValue, toJSON, toYAML } from '@speclynx/apidom-core';

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

  /**
   * Converts the document's API element to a plain JavaScript object.
   */
  toValue(): unknown {
    return toValue(this.parseResult.api!);
  }

  /**
   * Serializes the document's API element to a JSON string.
   */
  toJSON(...args: Parameters<typeof toJSON> extends [unknown, ...infer R] ? R : []): string {
    return toJSON(this.parseResult.api!, ...args);
  }

  /**
   * Serializes the document's API element to a YAML string.
   */
  toYAML(...args: Parameters<typeof toYAML> extends [unknown, ...infer R] ? R : []): string {
    return toYAML(this.parseResult.api!, ...args);
  }
}

export default APIDocument;
