import { Element, isParseResultElement, ParseResultElement } from '@speclynx/apidom-datamodel';
import {
  dereference as dereferenceURI,
  dereferenceApiDOM as dereferenceApiDOMElement,
  mergeOptions,
  ReferenceSet,
  Reference,
  UnmatchedDereferenceStrategyError,
} from '@speclynx/apidom-reference/configuration/empty';
import type { ApiDOMReferenceOptions } from '@speclynx/apidom-reference/configuration/empty';
import OpenAPI2DereferenceStrategy from '@speclynx/apidom-reference/dereference/strategies/openapi-2';
import OpenAPI3_0DereferenceStrategy from '@speclynx/apidom-reference/dereference/strategies/openapi-3-0';
import OpenAPI3_1DereferenceStrategy from '@speclynx/apidom-reference/dereference/strategies/openapi-3-1';
import OpenApiJSON2Parser from '@speclynx/apidom-reference/parse/parsers/openapi-json-2';
import OpenApiYAML2Parser from '@speclynx/apidom-reference/parse/parsers/openapi-yaml-2';
import OpenApiJSON3_0Parser from '@speclynx/apidom-reference/parse/parsers/openapi-json-3-0';
import OpenApiYAML3_0Parser from '@speclynx/apidom-reference/parse/parsers/openapi-yaml-3-0';
import OpenApiJSON3_1Parser from '@speclynx/apidom-reference/parse/parsers/openapi-json-3-1';
import OpenApiYAML3_1Parser from '@speclynx/apidom-reference/parse/parsers/openapi-yaml-3-1';
import JSONParser from '@speclynx/apidom-reference/parse/parsers/json';
import YAMLParser from '@speclynx/apidom-reference/parse/parsers/yaml-1-2';
import BinaryParser from '@speclynx/apidom-reference/parse/parsers/binary';
import FileResolver from '@speclynx/apidom-reference/resolve/resolvers/file';
import HTTPResolverAxios from '@speclynx/apidom-reference/resolve/resolvers/http-axios';
import { isSwaggerElement, mediaTypes as openApi2MediaTypes } from '@speclynx/apidom-ns-openapi-2';
import {
  isOpenApi3_0Element,
  mediaTypes as openApi3_0MediaTypes,
} from '@speclynx/apidom-ns-openapi-3-0';
import {
  isOpenApi3_1Element,
  mediaTypes as openApi3_1MediaTypes,
} from '@speclynx/apidom-ns-openapi-3-1';
import { toValue } from '@speclynx/apidom-core';
import type { PartialDeep } from 'type-fest';

import DereferenceError from '../errors/DereferenceError.ts';

/**
 * Options for dereferencing OpenAPI Documents.
 * @public
 */
export type Options = PartialDeep<ApiDOMReferenceOptions>;

/**
 * Default reference options for dereferencing OpenAPI Documents.
 * @public
 */
export const defaultOptions: Options = {
  resolve: {
    resolvers: [
      new FileResolver({ fileAllowList: ['*.json', '*.yaml', '*.yml'] }),
      new HTTPResolverAxios({ timeout: 5000, redirects: 5, withCredentials: false }),
    ],
  },
  parse: {
    parsers: [
      new OpenApiJSON2Parser({ allowEmpty: false, fileExtensions: ['.json'] }),
      new OpenApiYAML2Parser({ allowEmpty: false, fileExtensions: ['.yaml', '.yml'] }),
      new OpenApiJSON3_0Parser({ allowEmpty: false, fileExtensions: ['.json'] }),
      new OpenApiYAML3_0Parser({ allowEmpty: false, fileExtensions: ['.yaml', '.yml'] }),
      new OpenApiJSON3_1Parser({ allowEmpty: false, fileExtensions: ['.json'] }),
      new OpenApiYAML3_1Parser({ allowEmpty: false, fileExtensions: ['.yaml', '.yml'] }),
      new JSONParser({ allowEmpty: false, fileExtensions: ['.json'] }),
      new YAMLParser({ allowEmpty: false, fileExtensions: ['.yaml', '.yml'] }),
      new BinaryParser({ allowEmpty: false }),
    ],
    parserOpts: {
      sourceMap: false,
      style: false,
      strict: true,
    },
  },
  dereference: {
    strategies: [
      new OpenAPI2DereferenceStrategy(),
      new OpenAPI3_0DereferenceStrategy(),
      new OpenAPI3_1DereferenceStrategy(),
    ],
    strategyOpts: {},
  },
};

/**
 * Dereferences an OpenAPI Document from a file system path or HTTP(S) URL.
 *
 * This function resolves all JSON References ($ref) in the OpenAPI Document.
 *
 * Supports OpenAPI 2.0 (Swagger), OpenAPI 3.0.x, and OpenAPI 3.1.x.
 *
 * @param uri - A file system path or HTTP(S) URL to the OpenAPI Document
 * @param options - Reference options (uses defaultOptions when not provided)
 * @returns A promise that resolves to the dereferenced OpenAPI Document as ApiDOM element
 * @throws DereferenceError - When dereferencing fails or document is not an OpenAPI specification. The original error is available via the `cause` property.
 *
 * @example
 * // Dereference from file
 * const result = await dereferenceOpenAPI('/path/to/openapi.json');
 *
 * @example
 * // Dereference from URL
 * const result = await dereferenceOpenAPI('https://example.com/openapi.yaml');
 *
 * @example
 * // Dereference with custom options
 * const result = await dereferenceOpenAPI('/path/to/openapi.json', customReferenceOptions);
 * @public
 */
export async function dereference(uri: string, options: Options = {}): Promise<ParseResultElement> {
  const mergedOptions = mergeOptions(defaultOptions as ApiDOMReferenceOptions, options);

  try {
    const parseResult = await dereferenceURI(uri, mergedOptions);

    // validate that the dereferenced document is an OpenAPI specification
    if (!isOpenApiElement(parseResult.api)) {
      throw new UnmatchedDereferenceStrategyError(
        `Could not find a dereference strategy that can dereference "${uri}" as an OpenAPI specification`,
      );
    }

    parseResult.meta.set('retrievalURI', uri);
    return parseResult;
  } catch (error: unknown) {
    throw new DereferenceError(`Failed to dereference OpenAPI Document at "${uri}"`, {
      cause: error,
    });
  }
}

/**
 * Dereferences an ApiDOM element representing an OpenAPI Document.
 *
 * This function resolves all JSON References ($ref) in the OpenAPI Document element.
 *
 * Supported scenarios:
 * - ParseResultElement with retrievalURI metadata: baseURI derived automatically
 * - ParseResultElement without retrievalURI: requires `options.resolve.baseURI`
 * - Child element (e.g., PathItemElement) with parseResult in strategyOpts:
 *   requires `options.dereference.strategyOpts.parseResult` for component resolution,
 *   and `options.resolve.baseURI` if parseResult lacks retrievalURI metadata
 *
 * @param element - An ApiDOM element (ParseResultElement or child element like PathItemElement)
 * @param options - Reference options (uses defaultOptions when not provided)
 * @returns A promise that resolves to the dereferenced element
 * @throws DereferenceError - When baseURI is required but not provided, or when dereferencing fails
 *
 * @example
 * Dereference ParseResultElement with retrievalURI (from file parsing)
 * ```typescript
 * import { parseOpenAPI } from '@jentic/arazzo-parser';
 *
 * const parseResult = await parseOpenAPI('/path/to/openapi.json');
 * const dereferenced = await dereferenceOpenAPIElement(parseResult);
 * ```
 *
 * @example
 * Dereference ParseResultElement without retrievalURI (from inline parsing)
 * ```typescript
 * const parseResult = await parseOpenAPI({ openapi: '3.1.0', ... });
 * const dereferenced = await dereferenceOpenAPIElement(parseResult, {
 *   resolve: { baseURI: 'https://example.com/openapi.json' },
 * });
 * ```
 *
 * @example
 * Dereference child element (e.g., PathItemElement)
 * ```typescript
 * const parseResult = await parseOpenAPI('/path/to/openapi.json');
 * const pathItem = parseResult.api.paths.get('/users');
 * const dereferenced = await dereferenceOpenAPIElement(pathItem, {
 *   dereference: { strategyOpts: { parseResult } },
 * });
 * ```
 * @public
 */
export async function dereferenceElement<T extends Element>(
  element: T,
  options: Options = {},
): Promise<T> {
  const mergedOptions = mergeOptions(defaultOptions as ApiDOMReferenceOptions, options);
  const refSet = mergedOptions.dereference?.refSet ?? new ReferenceSet();
  let baseURI = mergedOptions.resolve?.baseURI;
  let mediaType: string = 'text/plain';

  if (refSet.size === 0) {
    if (isParseResultElement(element)) {
      if (isOpenApiElement(element.api)) {
        mediaType = inferOpenApiMediaType(element.api);
      }
      if (element.hasMetaProperty('retrievalURI')) {
        baseURI = toValue(element.meta.get('retrievalURI')) as string;
      } else if (!baseURI) {
        throw new DereferenceError(
          'baseURI option is required when dereferencing a ParseResultElement without retrievalURI metadata',
        );
      }
    } else if (isParseResultElement(mergedOptions.dereference?.strategyOpts?.parseResult)) {
      // dereferencing child element requires refSet for component resolution
      const { parseResult } = mergedOptions.dereference.strategyOpts;
      let rootURI: string;

      if (isOpenApiElement(parseResult.api)) {
        mediaType = inferOpenApiMediaType(parseResult.api);
      }

      if (parseResult.hasMetaProperty('retrievalURI')) {
        rootURI = toValue(parseResult.meta.get('retrievalURI')) as string;
      } else if (baseURI) {
        rootURI = baseURI;
      } else {
        throw new DereferenceError(
          'baseURI option is required when dereferencing a child element without retrievalURI metadata',
        );
      }

      const elementReference = new Reference({
        uri: `${rootURI}#fragment`,
        value: new ParseResultElement([element]),
      });
      const rootReference = new Reference({ uri: rootURI, value: parseResult });

      refSet.add(elementReference).add(rootReference);
      baseURI = rootURI;
    }
  }

  try {
    return await dereferenceApiDOMElement(
      element,
      mergeOptions(mergedOptions, {
        resolve: {
          baseURI,
        },
        parse: {
          mediaType,
        },
        dereference: { refSet },
      }),
    );
  } catch (error: unknown) {
    throw new DereferenceError('Failed to dereference OpenAPI Document', { cause: error });
  }
}

/**
 * Checks if the element is a valid OpenAPI specification element.
 */
function isOpenApiElement(element: unknown): boolean {
  return isSwaggerElement(element) || isOpenApi3_0Element(element) || isOpenApi3_1Element(element);
}

/**
 * Gets the appropriate mediaType for an OpenAPI element.
 */
function inferOpenApiMediaType(element: unknown): string {
  if (isSwaggerElement(element)) {
    return openApi2MediaTypes.latest();
  }
  if (isOpenApi3_0Element(element)) {
    return openApi3_0MediaTypes.latest();
  }
  if (isOpenApi3_1Element(element)) {
    return openApi3_1MediaTypes.latest();
  }
  return 'text/plain';
}
