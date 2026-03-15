import type { ParseResultElement } from '@jentic/arazzo-parser';
import { parseArazzo, defaultParseArazzoOptions } from '@jentic/arazzo-parser';
import {
  readFile,
  File,
  mergeOptions,
  type ApiDOMReferenceOptions,
} from '@speclynx/apidom-reference/configuration/empty';
import { UnmatchedResolverError } from '@speclynx/apidom-reference/configuration/empty';
import { toValue } from '@speclynx/apidom-core';
import { traverse, type Path } from '@speclynx/apidom-traverse';
import { type WorkflowElement } from '@speclynx/apidom-ns-arazzo-1';

import * as constants from '../../constants.ts';
import ArazzoDocument from '../../document/ArazzoDocument.ts';
import DocumentRegistryProvider, {
  type DocumentRegistryProviderOptions,
} from './DocumentRegistryProvider.ts';
import ArazzoWorkflowIndex from '../../document/ArazzoWorkflowIndex.ts';

/**
 * Options for loading an Arazzo document.
 * @public
 */
export type ArazzoDocumentRegistryProviderOptions = DocumentRegistryProviderOptions;

/**
 * Default options for loading an Arazzo document.
 *
 * Source description parsing and dereferencing are disabled by default;
 * source descriptions are handled separately during step execution.
 */
export const providerOptionsOverride: ArazzoDocumentRegistryProviderOptions = {
  resolve: {
    resolverOpts: {
      cache: {
        maxEntries: constants.MAX_HTTP_CACHE_ENTRIES,
        maxStaleAge: constants.MAX_HTTP_CACHE_STALE_AGE,
      },
    },
  },
};

/**
 * Provides ArazzoDocument instances for the DocumentRegistry.
 *
 * Parses, dereferences, and builds a WorkflowIndex for Arazzo documents.
 * @public
 */
class ArazzoDocumentRegistryProvider extends DocumentRegistryProvider {
  readonly #options: ArazzoDocumentRegistryProviderOptions;

  constructor(options: ArazzoDocumentRegistryProviderOptions = {}) {
    super();
    this.#options = mergeOptions(providerOptionsOverride as ApiDOMReferenceOptions, options);
  }

  async canProvide(uri: string): Promise<boolean> {
    try {
      const options = this.#buildParseOptions();
      const data = await readFile(uri, options);
      const file = new File({ uri, data });
      const parsers = options.parse.parsers.filter((p) => p.name.startsWith('arazzo'));

      for (const parser of parsers) {
        if (await parser.canParse(file)) return true;
      }
    } catch (error: unknown) {
      if (error instanceof UnmatchedResolverError) return false;
      throw error;
    }

    return false;
  }

  /**
   * Loads an Arazzo document from a URI and produces an ArazzoDocument.
   */
  async provide(uri: string): Promise<ArazzoDocument> {
    const parseResult = await parseArazzo(uri, this.#buildParseOptions());
    const workflowIndex = this.#buildWorkflowIndex(parseResult);

    return new ArazzoDocument(uri, parseResult, workflowIndex);
  }

  #buildWorkflowIndex(parseResult: ParseResultElement): ArazzoWorkflowIndex {
    const index = new ArazzoWorkflowIndex();

    traverse(parseResult.api, {
      WorkflowElement(path: Path) {
        const workflow = path.node as WorkflowElement;
        const workflowId = toValue(workflow.workflowId);

        if (typeof workflowId !== 'string') return path.skip();
        if (workflowId === '') return path.skip();

        index.set(workflowId, path.formatPath('jsonpointer'));

        path.skip();
      },
    });

    return index;
  }

  #buildParseOptions(): ApiDOMReferenceOptions {
    return mergeOptions(defaultParseArazzoOptions as ApiDOMReferenceOptions, this.#options);
  }
}

export default ArazzoDocumentRegistryProvider;
