import type { ParseResultElement } from '@jentic/arazzo-parser';
import { toValue } from '@speclynx/apidom-core';
import { isStringElement } from '@speclynx/apidom-datamodel';
import { find } from '@speclynx/apidom-traverse';
import {
  isSourceDescriptionElement,
  type SourceDescriptionElement,
} from '@speclynx/apidom-ns-arazzo-1';
import { url } from '@speclynx/apidom-reference';

import APIDocument from './Document.ts';
import type WorkflowIndex from '../providers/arazzo/WorkflowIndex.ts';

/**
 * An Arazzo document held by the document registry.
 * @public
 */
class ArazzoDocument extends APIDocument {
  readonly type = 'arazzo' as const;
  isEntry: boolean;
  readonly workflowIndex: WorkflowIndex;

  constructor(
    uri: string,
    parseResult: ParseResultElement,
    workflowIndex: WorkflowIndex,
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
   * Resolves a source description name to its canonical URI.
   *
   * Looks up the name in this document's sourceDescriptions array
   * and resolves the url against this document's base URI.
   */
  resolveSourceDescriptionURI(sourceDescriptionName: string): string | undefined {
    const sourceDescriptionPath = find(this.parseResult, (path) => {
      return (
        isSourceDescriptionElement(path.node) &&
        isStringElement(path.node.name) &&
        path.node.name.equals(sourceDescriptionName)
      );
    });

    if (!sourceDescriptionPath) return;

    const sourceDescription = sourceDescriptionPath.node as SourceDescriptionElement;

    if (!isStringElement(sourceDescription.url)) return;

    return url.sanitize(
      url.stripHash(url.resolve(this.uri, toValue(sourceDescription.url) as string)),
    );
  }
}

export default ArazzoDocument;
