import type { ParseResultElement } from '@jentic/arazzo-parser';
import { toValue, toYAML } from '@speclynx/apidom-core';

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
   * Returns a JSON-serializable representation of the document's API element.
   * Compatible with JSON.stringify() — JSON.stringify(doc) produces correct output.
   */
  toJSON(): unknown {
    return toValue(this.parseResult.api!);
  }

  /**
   * Serializes the document's API element to a YAML string.
   */
  toYAML(...args: Parameters<typeof toYAML> extends [unknown, ...infer R] ? R : []): string {
    return toYAML(this.parseResult.api!, ...args);
  }
}

export default APIDocument;
