import type { ParseResultElement } from '@jentic/arazzo-parser';
import { parseOpenAPI, defaultOpenAPIOptions as parserDefaultOptions } from '@jentic/arazzo-parser';
import {
  dereferenceOpenAPIElement,
  defaultDereferenceOpenAPIOptions as resolverDefaultOptions,
} from '@jentic/arazzo-resolver';
import { isStringElement } from '@speclynx/apidom-datamodel';
import { traverseAsync, type Path } from '@speclynx/apidom-traverse';
import {
  type PathItemElement as PathItemElement2,
  type OperationElement as OperationElement2,
} from '@speclynx/apidom-ns-openapi-2';
import {
  type PathItemElement as PathItemElement30,
  type OperationElement as OperationElement30,
} from '@speclynx/apidom-ns-openapi-3-0';
import {
  type PathItemElement as PathItemElement31,
  type OperationElement as OperationElement31,
} from '@speclynx/apidom-ns-openapi-3-1';
import { toValue } from '@speclynx/apidom-core';

import * as constants from '../../../constants.ts';
import OpenAPIDocument from '../../documents/OpenAPIDocument.ts';
import DocumentRegistryProvider, {
  type DocumentRegistryProviderOptions,
} from '../DocumentRegistryProvider.ts';
import OperationIndex from './OperationIndex.ts';

/**
 * Type definitions.
 */
type PathItemElement = PathItemElement2 | PathItemElement30 | PathItemElement31;
type OperationElement = OperationElement2 | OperationElement30 | OperationElement31;

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

    const operationIndex = await this.#buildOperationIndex(parseResult);
    return new OpenAPIDocument(uri, parseResult, operationIndex);
  }

  async #buildOperationIndex(parseResult: ParseResultElement): Promise<OperationIndex> {
    const index = new OperationIndex();

    await traverseAsync(parseResult.api, {
      async PathItemElement(path: Path) {
        const pathItem = path.node as PathItemElement;

        if (!pathItem.hasMetaProperty('path')) return path.skip();
        if (!isStringElement(pathItem.$ref)) return;

        const pathItemDereferenced = await dereferenceOpenAPIElement(pathItem, defaultOptions);
        path.replaceWith(pathItemDereferenced);
      },

      OperationElement(path: Path) {
        const operation = path.node as OperationElement;
        const operationId = toValue(operation.operationId);

        if (typeof operationId !== 'string') return path.skip();
        if (operationId === '') return path.skip();

        index.set(operationId, path.formatPath('jsonpointer'));

        path.skip();
      },
    });

    return index;
  }
}

export default OpenAPIDocumentRegistryProvider;
