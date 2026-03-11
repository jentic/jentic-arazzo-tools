import type { ParseResultElement } from '@jentic/arazzo-parser';
import { parseOpenAPI, defaultOpenAPIOptions as parserDefaultOptions } from '@jentic/arazzo-parser';
import {
  dereferenceOpenAPIElement,
  defaultDereferenceOpenAPIOptions as resolverDefaultOptions,
} from '@jentic/arazzo-resolver';

import * as constants from '../../../constants.ts';
import OpenAPIDocument from '../../documents/OpenAPIDocument.ts';
import DocumentRegistryProvider, {
  type DocumentRegistryProviderOptions,
} from '../DocumentRegistryProvider.ts';
import OperationIndex from './OperationIndex.ts';

/**
 * Options for loading an OpenAPI document.
 * @public
 */
export type OpenAPIDocumentRegistryProviderOptions = DocumentRegistryProviderOptions;

/**
 * Default options for loading an OpenAPI document.
 */
const defaultOptions: OpenAPIDocumentRegistryProviderOptions = {
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
  },
};

/**
 * Provides OpenAPIDocument instances for the DocumentRegistry.
 *
 * Parses, dereferences, and builds an OperationIndex for OpenAPI documents.
 * @public
 */
class OpenAPIDocumentRegistryProvider extends DocumentRegistryProvider {
  constructor(options: OpenAPIDocumentRegistryProviderOptions = {}) {
    super(defaultOptions, options);
  }

  protected get parserNamePrefix(): string {
    return 'openapi';
  }

  /**
   * Loads an OpenAPI document from a URI and produces an OpenAPIDocument.
   */
  async provide(uri: string): Promise<OpenAPIDocument> {
    let parseResult: ParseResultElement;
    parseResult = await parseOpenAPI(uri, this.options);
    parseResult = await dereferenceOpenAPIElement(parseResult, this.options);

    const operationIndex = this.#buildOperationIndex(parseResult);
    return new OpenAPIDocument(uri, parseResult, operationIndex);
  }

  #buildOperationIndex(_parseResult: ParseResultElement): OperationIndex {
    return new OperationIndex();
  }
}

export default OpenAPIDocumentRegistryProvider;
