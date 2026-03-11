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
import Arazzo1DereferenceStrategy from '@speclynx/apidom-reference/dereference/strategies/arazzo-1';
import OpenAPI2DereferenceStrategy from '@speclynx/apidom-reference/dereference/strategies/openapi-2';
import OpenAPI30DereferenceStrategy from '@speclynx/apidom-reference/dereference/strategies/openapi-3-0';
import OpenAPI31DereferenceStrategy from '@speclynx/apidom-reference/dereference/strategies/openapi-3-1';
import JSONParser from '@speclynx/apidom-reference/parse/parsers/json';
import YAMLParser from '@speclynx/apidom-reference/parse/parsers/yaml-1-2';
import BinaryParser from '@speclynx/apidom-reference/parse/parsers/binary';
import { isArazzoSpecification1Element, mediaTypes } from '@speclynx/apidom-ns-arazzo-1';
import type { PartialDeep } from 'type-fest';
import { defaultArazzoOptions as parserDefaultOptions } from '@jentic/arazzo-parser';

import DereferenceError from '../errors/DereferenceError.ts';

/**
 * Options for dereferencing Arazzo Documents.
 * @public
 */
export type Options = PartialDeep<ApiDOMReferenceOptions>;

/**
 * Default reference options for dereferencing Arazzo Documents.
 * @public
 */
export const defaultOptions: Options = {
  resolve: {
    resolvers: [...parserDefaultOptions.resolve!.resolvers!],
  },
  parse: {
    parsers: [
      ...parserDefaultOptions.parse!.parsers!,
      new JSONParser({ allowEmpty: false }),
      new YAMLParser({ allowEmpty: false }),
      new BinaryParser({ allowEmpty: false }),
    ],
    parserOpts: { ...parserDefaultOptions.parse!.parserOpts },
  },
  dereference: {
    strategies: [
      new Arazzo1DereferenceStrategy(),
      new OpenAPI2DereferenceStrategy(),
      new OpenAPI30DereferenceStrategy(),
      new OpenAPI31DereferenceStrategy(),
    ],
    strategyOpts: {
      sourceDescriptions: false,
    },
  },
};

/**
 * Dereferences an Arazzo Document from a file system path or HTTP(S) URL.
 *
 * This function resolves all JSON References ($ref) and Reusable Object references
 * ($components.*) in the Arazzo Document.
 *
 * Source descriptions can optionally be dereferenced using strategy options:
 * - `sourceDescriptions`: `true` (all) or `['name1', 'name2']` (specific names only)
 * - `sourceDescriptionsMaxDepth`: Maximum recursion depth for nested Arazzo source descriptions (default: `+Infinity`)
 *
 * Options can be passed globally via `strategyOpts` or strategy-specific via `strategyOpts['arazzo-1']`.
 *
 * @param uri - A file system path or HTTP(S) URL to the Arazzo Document
 * @param options - Reference options (uses defaultOptions when not provided)
 * @returns A promise that resolves to the dereferenced Arazzo Document as ApiDOM element
 * @throws DereferenceError - When dereferencing fails or document is not an Arazzo specification. The original error is available via the `cause` property.
 *
 * @example
 * // Dereference from file
 * const result = await dereferenceArazzo('/path/to/arazzo.json');
 *
 * @example
 * // Dereference from URL
 * const result = await dereferenceArazzo('https://example.com/arazzo.yaml');
 *
 * @example
 * Dereference with source descriptions
 * ```typescript
 * const result = await dereferenceArazzo('/path/to/arazzo.json', {
 *   dereference: { strategyOpts: { sourceDescriptions: true } },
 * });
 * ```
 *
 * @example
 * // Dereference with custom options
 * const result = await dereferenceArazzo('/path/to/arazzo.json', customReferenceOptions);
 * @public
 */
export async function dereference(uri: string, options: Options = {}): Promise<ParseResultElement> {
  const mergedOptions = mergeOptions(defaultOptions as ApiDOMReferenceOptions, options);

  try {
    const parseResult = await dereferenceURI(uri, mergedOptions);

    // validate that the dereferenced document is an Arazzo specification
    if (!isArazzoSpecification1Element(parseResult.api)) {
      throw new UnmatchedDereferenceStrategyError(
        `Could not find a dereference strategy that can dereference "${uri}" as an Arazzo specification`,
      );
    }

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
 * This function resolves all JSON References ($ref) and Reusable Object references
 * ($components.*) in the Arazzo Document element.
 *
 * Supported scenarios:
 * - ParseResultElement with retrievalURI metadata: baseURI derived automatically
 * - ParseResultElement without retrievalURI: requires `options.resolve.baseURI`
 * - Child element (e.g., WorkflowElement) with parseResult in strategyOpts:
 *   requires `options.dereference.strategyOpts.parseResult` for component resolution,
 *   and `options.resolve.baseURI` if parseResult lacks retrievalURI metadata
 *
 * Source descriptions can optionally be dereferenced using strategy options:
 * - `sourceDescriptions`: `true` (all) or `['name1', 'name2']` (specific names only)
 * - `sourceDescriptionsMaxDepth`: Maximum recursion depth for nested Arazzo source descriptions (default: `+Infinity`)
 *
 * Options can be passed globally via `strategyOpts` or strategy-specific via `strategyOpts['arazzo-1']`.
 *
 * @param element - An ApiDOM element (ParseResultElement or child element like WorkflowElement)
 * @param options - Reference options (uses defaultOptions when not provided)
 * @returns A promise that resolves to the dereferenced element
 * @throws DereferenceError - When baseURI is required but not provided, or when dereferencing fails
 *
 * @example
 * Dereference ParseResultElement with retrievalURI (from file parsing)
 * ```typescript
 * import { parseArazzo } from '@jentic/arazzo-parser';
 *
 * const parseResult = await parseArazzo('/path/to/arazzo.json');
 * const dereferenced = await dereferenceArazzoElement(parseResult);
 * ```
 *
 * @example
 * Dereference ParseResultElement without retrievalURI (from inline parsing)
 * ```typescript
 * const parseResult = await parseArazzo({ arazzo: '1.0.1', ... });
 * const dereferenced = await dereferenceArazzoElement(parseResult, {
 *   resolve: { baseURI: 'https://example.com/arazzo.json' },
 * });
 * ```
 *
 * @example
 * Dereference child element (e.g., WorkflowElement)
 * ```typescript
 * const parseResult = await parseArazzo('/path/to/arazzo.json');
 * const workflow = parseResult.api.workflows.get(0);
 * const dereferenced = await dereferenceArazzoElement(workflow, {
 *   dereference: { strategyOpts: { parseResult } },
 * });
 * ```
 *
 * @example
 * Dereference with source descriptions
 * ```typescript
 * const parseResult = await parseArazzo('/path/to/arazzo.json');
 * const dereferenced = await dereferenceArazzoElement(parseResult, {
 *   dereference: { strategyOpts: { sourceDescriptions: true } },
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
      if (isArazzoSpecification1Element(element.api)) {
        mediaType = mediaTypes.latest();
      }
      if (element.hasMetaProperty('retrievalURI')) {
        baseURI = element.meta.get('retrievalURI') as string;
      } else if (!baseURI) {
        throw new DereferenceError(
          'baseURI option is required when dereferencing a ParseResultElement without retrievalURI metadata',
        );
      }
    } else if (isParseResultElement(mergedOptions.dereference?.strategyOpts?.parseResult)) {
      // dereferencing child element requires refSet for component resolution
      const { parseResult } = mergedOptions.dereference.strategyOpts;
      let rootURI: string;

      if (isArazzoSpecification1Element(parseResult.api)) {
        mediaType = mediaTypes.latest();
      }

      if (parseResult.hasMetaProperty('retrievalURI')) {
        rootURI = parseResult.meta.get('retrievalURI') as string;
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
    throw new DereferenceError('Failed to dereference Arazzo Document', { cause: error });
  }
}
