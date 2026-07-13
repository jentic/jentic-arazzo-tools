import type { ParseResultElement } from '@jentic/arazzo-parser';
import { toValue } from '@speclynx/apidom-core';
import { isStringElement } from '@speclynx/apidom-datamodel';
import { find, filter } from '@speclynx/apidom-traverse';
import {
  isSourceDescriptionElement,
  type SourceDescriptionElement,
} from '@speclynx/apidom-ns-arazzo-1';
import { url } from '@speclynx/apidom-reference/configuration/empty';

import APIDocument from './APIDocument.ts';
import type ArazzoWorkflowIndex from './ArazzoWorkflowIndex.ts';

/**
 * An Arazzo document held by the document registry.
 * @public
 */
class ArazzoDocument extends APIDocument {
  readonly type = 'arazzo' as const;
  isEntry: boolean;
  readonly workflowIndex: ArazzoWorkflowIndex;

  constructor(
    uri: string,
    parseResult: ParseResultElement,
    workflowIndex: ArazzoWorkflowIndex,
    isEntry = false,
  ) {
    super(uri, parseResult);
    this.isEntry = isEntry;
    this.workflowIndex = workflowIndex;
  }

  /**
   * Type guard for ArazzoDocument.
   */
  static is(doc: APIDocument): doc is ArazzoDocument {
    return doc.type === 'arazzo';
  }

  /**
   * Finds a source description element by name.
   */
  #findSourceDescription(sourceDescriptionName: string): SourceDescriptionElement | undefined {
    const sourceDescriptionPath = find(this.parseResult, (path) => {
      return (
        isSourceDescriptionElement(path.node) &&
        isStringElement(path.node.name) &&
        path.node.name.equals(sourceDescriptionName)
      );
    });

    return sourceDescriptionPath?.node as SourceDescriptionElement | undefined;
  }

  /**
   * Resolves a source description name to its canonical URI.
   *
   * Looks up the name in this document's sourceDescriptions array
   * and resolves the url against this document's base URI.
   */
  resolveSourceDescriptionURI(sourceDescriptionName: string): string | undefined {
    const sourceDescription = this.#findSourceDescription(sourceDescriptionName);

    if (sourceDescription === undefined || !isStringElement(sourceDescription.url)) return;

    return url.sanitize(
      url.stripHash(url.resolve(this.uri, toValue(sourceDescription.url) as string)),
    );
  }

  /**
   * Resolves a field of a source description object (e.g. `url`, `type`).
   *
   * The `url` field resolves to the canonical URI (resolved against this
   * document's base URI, as `resolveSourceDescriptionURI` does); every other
   * field resolves to its literal value. Returns `undefined` when the source
   * description or the field is absent.
   */
  resolveSourceDescriptionField(sourceDescriptionName: string, field: string): unknown {
    if (field === 'url') return this.resolveSourceDescriptionURI(sourceDescriptionName);

    const sourceDescription = this.#findSourceDescription(sourceDescriptionName);
    if (sourceDescription === undefined) return undefined;

    return toValue(sourceDescription.get(field));
  }

  /**
   * The canonical URIs of this document's source descriptions, resolved against
   * this document's base URI, in declaration order. Sources without a resolvable
   * url are omitted.
   */
  sourceDescriptionURIs(): string[] {
    return filter(
      this.parseResult,
      (path) => isSourceDescriptionElement(path.node) && isStringElement(path.node.name),
    )
      .map((path) => toValue((path.node as SourceDescriptionElement).name) as string)
      .map((name) => this.resolveSourceDescriptionURI(name))
      .filter((uri): uri is string => uri !== undefined);
  }
}

export default ArazzoDocument;
