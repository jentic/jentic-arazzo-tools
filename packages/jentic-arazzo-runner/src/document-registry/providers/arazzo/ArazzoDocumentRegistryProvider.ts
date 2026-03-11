import type { ParseResultElement } from '@jentic/arazzo-parser';
import { parseArazzo, defaultArazzoOptions as parserDefaultOptions } from '@jentic/arazzo-parser';
import {
  dereferenceArazzoElement,
  defaultDereferenceArazzoOptions as resolverDefaultOptions,
} from '@jentic/arazzo-resolver';

import * as constants from '../../../constants.ts';
import ArazzoDocument from '../../documents/ArazzoDocument.ts';
import DocumentRegistryProvider, {
  type DocumentRegistryProviderOptions,
} from '../DocumentRegistryProvider.ts';
import WorkflowIndex from './WorkflowIndex.ts';

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
const defaultOptions: ArazzoDocumentRegistryProviderOptions = {
  parse: {
    parsers: parserDefaultOptions.parse!.parsers,
    parserOpts: parserDefaultOptions.parse!.parserOpts,
  },
  resolve: {
    resolvers: parserDefaultOptions.resolve!.resolvers,
    resolverOpts: {
      cache: {
        maxEntries: constants.MAX_HTTP_CACHE_ENTRIES,
        maxStaleAge: constants.MAX_HTTP_CACHE_STALE_AGE,
      },
    },
  },
  dereference: {
    strategies: resolverDefaultOptions.dereference!.strategies,
    strategyOpts: {
      sourceDescriptions: false,
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
  constructor(options: ArazzoDocumentRegistryProviderOptions = {}) {
    super(defaultOptions, options);
  }

  protected get parserNamePrefix(): string {
    return 'arazzo';
  }

  /**
   * Loads an Arazzo document from a URI and produces an ArazzoDocument.
   */
  async provide(uri: string): Promise<ArazzoDocument> {
    let parseResult: ParseResultElement;
    parseResult = await parseArazzo(uri, this.options);
    parseResult = await dereferenceArazzoElement(parseResult, this.options);

    const workflowIndex = this.#buildWorkflowIndex(parseResult);
    return new ArazzoDocument(uri, parseResult, workflowIndex);
  }

  #buildWorkflowIndex(_parseResult: ParseResultElement): WorkflowIndex {
    return new WorkflowIndex();
  }
}

export default ArazzoDocumentRegistryProvider;
