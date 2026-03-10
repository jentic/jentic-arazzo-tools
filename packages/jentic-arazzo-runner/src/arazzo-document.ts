import type { ParseResultElement } from '@speclynx/apidom-datamodel';
import {
  mergeOptions,
  type ApiDOMReferenceOptions,
} from '@speclynx/apidom-reference/configuration/empty';
import { parseArazzo } from '@jentic/arazzo-parser';
import { dereferenceArazzoElement } from '@jentic/arazzo-resolver';
import type { PartialDeep } from 'type-fest';

import ArazzoDocumentError from './errors/ArazzoDocumentError.ts';
import * as constants from './constants.ts';

/**
 * options for loading an Arazzo document.
 * @public
 */
export type LoadArazzoDocumentOptions = PartialDeep<ApiDOMReferenceOptions>;

/**
 * default options for loading an Arazzo document.
 *
 * source description parsing and dereferencing are disabled by default;
 * source descriptions are handled separately by SourceDescriptionStore.
 * @public
 */
export const defaultOptions: LoadArazzoDocumentOptions = {
  parse: {
    parserOpts: {
      sourceDescriptions: false,
    },
  },
  resolve: {
    resolverOpts: {
      cache: {
        maxEntries: constants.MAX_HTTP_CACHE_ENTRIES,
        maxStaleAge: constants.MAX_HTTP_CACHE_STALE_AGE,
      },
    },
  },
  dereference: {
    strategyOpts: {
      sourceDescriptions: false,
    },
  },
};

/**
 * loads and dereferences an Arazzo document.
 *
 * accepts a URI (file path or HTTP(S) URL), an inline string (JSON or YAML),
 * or a plain object. Uses \@jentic/arazzo-parser MemoryResolver for in-memory sources.
 *
 * @param source - URI, inline JSON/YAML string, or plain object
 * @param options - reference options merged on top of defaultOptions
 * @returns dereferenced Arazzo document as ParseResultElement
 * @throws ArazzoDocumentError when parsing or dereferencing fails
 * @public
 */
export async function loadArazzoDocument(
  source: string | Record<string, unknown>,
  options: LoadArazzoDocumentOptions = {},
): Promise<ParseResultElement> {
  const mergedOptions = mergeOptions(defaultOptions as ApiDOMReferenceOptions, options);

  try {
    const parseResult = await parseArazzo(source, mergedOptions);
    return await dereferenceArazzoElement(parseResult, mergedOptions);
  } catch (error: unknown) {
    throw new ArazzoDocumentError('Error while loading Arazzo document', {
      cause: error,
      document: source,
    });
  }
}
