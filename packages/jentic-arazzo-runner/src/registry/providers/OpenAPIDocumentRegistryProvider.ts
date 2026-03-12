import type { ParseResultElement } from '@jentic/arazzo-parser';
import { parseOpenAPI, defaultParseOpenAPIOptions } from '@jentic/arazzo-parser';
import {
  dereferenceOpenAPIElement,
  defaultDereferenceOpenAPIOptions,
} from '@jentic/arazzo-resolver';
import { isStringElement } from '@speclynx/apidom-datamodel';
import {
  readFile,
  File,
  mergeOptions,
  type ApiDOMReferenceOptions,
} from '@speclynx/apidom-reference/configuration/empty';
import { UnmatchedResolverError } from '@speclynx/apidom-reference/configuration/empty';
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

import * as constants from '../../constants.ts';
import OpenAPIDocument from '../../document/OpenAPIDocument.ts';
import DocumentRegistryProvider, {
  type DocumentRegistryProviderOptions,
} from './DocumentRegistryProvider.ts';
import OpenAPIOperationIndex from '../../document/OpenAPIOperationIndex.ts';

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
const providerOptionsOverride: OpenAPIDocumentRegistryProviderOptions = {
  resolve: {
    resolverOpts: {
      cache: {
        maxEntries: constants.MAX_HTTP_CACHE_ENTRIES,
        maxStaleAge: constants.MAX_HTTP_CACHE_STALE_AGE,
      },
    },
  },
  dereference: {
    immutable: false,
  },
};

/**
 * Provides OpenAPIDocument instances for the DocumentRegistry.
 *
 * Parses, dereferences, and builds an OperationIndex for OpenAPI documents.
 * @public
 */
class OpenAPIDocumentRegistryProvider extends DocumentRegistryProvider {
  readonly #options: OpenAPIDocumentRegistryProviderOptions;

  constructor(options: OpenAPIDocumentRegistryProviderOptions = {}) {
    super();
    this.#options = mergeOptions(providerOptionsOverride as ApiDOMReferenceOptions, options);
  }

  async canProvide(uri: string): Promise<boolean> {
    try {
      const options = this.#buildParseOptions();
      const data = await readFile(uri, options);
      const file = new File({ uri, data });
      const parsers = options.parse.parsers.filter((p) => p.name.startsWith('openapi'));

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
   * Loads an OpenAPI document from a URI and produces an OpenAPIDocument.
   */
  async provide(uri: string): Promise<OpenAPIDocument> {
    const parseResult: ParseResultElement = await parseOpenAPI(uri, this.#buildParseOptions());
    const operationIndex = await this.#buildOperationIndex(parseResult);

    return new OpenAPIDocument(uri, parseResult, operationIndex);
  }

  async #buildOperationIndex(parseResult: ParseResultElement): Promise<OpenAPIOperationIndex> {
    const index = new OpenAPIOperationIndex();
    const dereferenceOptions = this.#buildDereferenceOptions(parseResult);

    const apiDereferenced = await traverseAsync(parseResult.api, {
      async PathItemElement(path: Path) {
        const pathItem = path.node as PathItemElement;

        if (!pathItem.hasMetaProperty('path')) return path.skip();
        if (!isStringElement(pathItem.$ref)) return;

        const pathItemDereferenced = await dereferenceOpenAPIElement(pathItem, dereferenceOptions);
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

    parseResult.replaceResult(apiDereferenced!);

    return index;
  }

  #buildParseOptions(): ApiDOMReferenceOptions {
    return mergeOptions(defaultParseOpenAPIOptions as ApiDOMReferenceOptions, this.#options);
  }

  #buildDereferenceOptions(parseResult?: ParseResultElement): ApiDOMReferenceOptions {
    let options = mergeOptions(
      defaultDereferenceOpenAPIOptions as ApiDOMReferenceOptions,
      this.#options,
    );
    if (parseResult) {
      options = mergeOptions(options, {
        dereference: { strategyOpts: { parseResult } },
      });
    }
    return options;
  }
}

export default OpenAPIDocumentRegistryProvider;
