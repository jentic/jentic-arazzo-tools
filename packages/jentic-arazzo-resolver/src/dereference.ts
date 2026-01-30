import type { Element, ParseResultElement } from '@speclynx/apidom-datamodel';
import {
  dereference as dereferenceURI,
  dereferenceApiDOM as dereferenceApiDOMElement,
  mergeOptions,
} from '@speclynx/apidom-reference/configuration/empty';
import type { ApiDOMReferenceOptions } from '@speclynx/apidom-reference';
import Arazzo1DereferenceStrategy from '@speclynx/apidom-reference/dereference/strategies/arazzo-1';
import OpenAPI2DereferenceStrategy from '@speclynx/apidom-reference/dereference/strategies/openapi-2';
import OpenAPI3_0DereferenceStrategy from '@speclynx/apidom-reference/dereference/strategies/openapi-3-0';
import OpenAPI3_1DereferenceStrategy from '@speclynx/apidom-reference/dereference/strategies/openapi-3-1';
import ArazzoJSON1Parser from '@speclynx/apidom-reference/parse/parsers/arazzo-json-1';
import ArazzoYAML1Parser from '@speclynx/apidom-reference/parse/parsers/arazzo-yaml-1';
import JSONParser from '@speclynx/apidom-reference/parse/parsers/json';
import YAMLParser from '@speclynx/apidom-reference/parse/parsers/yaml-1-2';
import BinaryParser from '@speclynx/apidom-reference/parse/parsers/binary';
import FileResolver from '@speclynx/apidom-reference/resolve/resolvers/file';
import HTTPResolverAxios from '@speclynx/apidom-reference/resolve/resolvers/http-axios';
import { mediaTypes } from '@speclynx/apidom-ns-arazzo-1';

import DereferenceError from './errors/DereferenceError.ts';

type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

type Options = PartialDeep<ApiDOMReferenceOptions>;

/**
 * Default reference options for dereferencing Arazzo Documents.
 * @public
 */
export const defaultOptions: Options = {
  resolve: {
    baseURI: 'https://jentic.com',
    resolvers: [
      new FileResolver({ fileAllowList: ['*.json', '*.yaml', '*.yml'] }),
      new HTTPResolverAxios({ timeout: 5000, redirects: 5, withCredentials: false }),
    ],
  },
  parse: {
    mediaType: mediaTypes.latest(),
    parsers: [
      new ArazzoJSON1Parser({ allowEmpty: false, sourceMap: false }),
      new ArazzoYAML1Parser({ allowEmpty: false, sourceMap: false }),
      new JSONParser({ allowEmpty: false, sourceMap: false }),
      new YAMLParser({ allowEmpty: false, sourceMap: false }),
      new BinaryParser({ allowEmpty: false, sourceMap: false }),
    ],
  },
  dereference: {
    strategies: [
      new Arazzo1DereferenceStrategy(),
      new OpenAPI2DereferenceStrategy(),
      new OpenAPI3_0DereferenceStrategy(),
      new OpenAPI3_1DereferenceStrategy(),
    ],
  },
};

/**
 * Dereferences an Arazzo Document from a file system path or HTTP(S) URL.
 *
 * This function resolves all JSON References ($ref) in the Arazzo Document
 * and its referenced OpenAPI/AsyncAPI source descriptions.
 *
 * @param uri - A file system path or HTTP(S) URL to the Arazzo Document
 * @param options - Reference options (uses defaultOptions when not provided)
 * @returns A promise that resolves to the dereferenced Arazzo Document as ApiDOM element
 * @throws DereferenceError - When dereferencing fails for any reason. The original error is available via the `cause` property.
 *
 * @example
 * // Dereference from file
 * const result = await dereference('/path/to/arazzo.json');
 *
 * @example
 * // Dereference from URL
 * const result = await dereference('https://example.com/arazzo.yaml');
 *
 * @example
 * // Dereference with custom options
 * const result = await dereference('/path/to/arazzo.json', customReferenceOptions);
 * @public
 */
export async function dereference(uri: string, options: Options = {}): Promise<ParseResultElement> {
  const mergedOptions = mergeOptions(defaultOptions as ApiDOMReferenceOptions, options);

  try {
    const parseResult = await dereferenceURI(uri, mergedOptions);
    parseResult.meta.set('retrievalURI', uri);
    return parseResult;
  } catch (error: unknown) {
    throw new DereferenceError(`Failed to dereference Arazzo Document at "${uri}"`, {
      cause: error,
    });
  }
}

/**
 * Dereferences an ApiDOM element representing an Arazzo Document.
 *
 * This function resolves all JSON References ($ref) in the Arazzo Document element
 * and its referenced OpenAPI/AsyncAPI source descriptions.
 *
 * Use this function when you have already parsed an Arazzo Document using `@jentic/arazzo-parser`
 * and want to dereference the resulting ApiDOM element.
 *
 * @param element - An ApiDOM element (e.g., ParseResultElement from `@jentic/arazzo-parser`)
 * @param options - Reference options (uses defaultOptions when not provided)
 * @returns A promise that resolves to the dereferenced Arazzo Document as ApiDOM element
 * @throws DereferenceError - When dereferencing fails for any reason. The original error is available via the `cause` property.
 *
 * @example
 * // Parse and then dereference
 * import \{ parse \} from '@jentic/arazzo-parser';
 *
 * const parseResult = await parse('/path/to/arazzo.json');
 * const dereferenced = await dereferenceApiDOM(parseResult);
 *
 * @example
 * // Dereference with custom options
 * const dereferenced = await dereferenceApiDOM(parseResult, customReferenceOptions);
 * @public
 */
export async function dereferenceApiDOM<T extends Element>(
  element: T,
  options: Options = {},
): Promise<T> {
  const mergedOptions = mergeOptions(defaultOptions as ApiDOMReferenceOptions, options);

  try {
    return await dereferenceApiDOMElement(element, mergedOptions);
  } catch (error: unknown) {
    throw new DereferenceError('Failed to dereference Arazzo Document', { cause: error });
  }
}
