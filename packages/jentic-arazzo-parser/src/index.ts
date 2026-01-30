import { ParseResultElement } from '@speclynx/apidom-datamodel';
import { refractArazzoSpecification1 } from '@speclynx/apidom-ns-arazzo-1';
import ApiDOMParser, { ParserError } from '@speclynx/apidom-parser';
import * as jsonParserAdapter from '@speclynx/apidom-parser-adapter-arazzo-json-1';
import * as yamlParserAdapter from '@speclynx/apidom-parser-adapter-arazzo-yaml-1';
import { parse as parseURI, mergeOptions } from '@speclynx/apidom-reference/configuration/empty';
import type { ApiDOMReferenceOptions } from '@speclynx/apidom-reference';
import ArazzoJSON1Parser from '@speclynx/apidom-reference/parse/parsers/arazzo-json-1';
import ArazzoYAML1Parser from '@speclynx/apidom-reference/parse/parsers/arazzo-yaml-1';
import FileResolver from '@speclynx/apidom-reference/resolve/resolvers/file';
import HTTPResolverAxios from '@speclynx/apidom-reference/resolve/resolvers/http-axios';
import { isPlainObject } from 'ramda-adjunct';

import ParseError from './errors/ParseError.ts';

type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

type Options = PartialDeep<ApiDOMReferenceOptions>;

/**
 * Default reference options for parsing Arazzo Documents.
 * @public
 */
export const defaultOptions: Options = {
  parse: {
    parsers: [
      new ArazzoJSON1Parser({ allowEmpty: false, sourceMap: false }),
      new ArazzoYAML1Parser({ allowEmpty: false, sourceMap: false }),
    ],
    parserOpts: {},
  },
  resolve: {
    resolvers: [
      new FileResolver({ fileAllowList: ['*.json', '*.yaml', '*.yml'] }),
      new HTTPResolverAxios({ timeout: 5000, redirects: 5, withCredentials: false }),
    ],
    resolverOpts: {},
  },
};

const parser = new ApiDOMParser();
parser.use(jsonParserAdapter);
parser.use(yamlParserAdapter);

/**
 * Parses an Arazzo Document from an object.
 * @param source - The Arazzo Document as a plain object
 * @param options - Reference options (uses defaultOptions when not provided)
 * @returns A promise that resolves to the parsed Arazzo Document as ApiDOM data model
 * @public
 */
export async function parse(
  source: Record<string, unknown>,
  options?: Options,
): Promise<ParseResultElement>;
/**
 * Parses an Arazzo Document from a string or URI.
 * @param source - The Arazzo Document as string content, or a file system path / HTTP(S) URL
 * @param options - Reference options (uses defaultOptions when not provided)
 * @returns A promise that resolves to the parsed Arazzo Document as ApiDOM data model
 * @throws ParseError - When parsing fails for any reason. The original error is available via the `cause` property.
 * @public
 */
export async function parse(source: string, options?: Options): Promise<ParseResultElement>;
/**
 * Parses an Arazzo Document from a string, object, or URI.
 *
 * The function handles three types of input:
 * 1. Object - directly refracts the object into an Arazzo specification element
 * 2. String content - attempts to parse as an inline Arazzo Document (JSON or YAML)
 * 3. URI string - treats as a file system path or HTTP(S) URL and resolves the document
 *
 * @param source - The Arazzo Document as an object, string content, or a file system path / HTTP(S) URL
 * @param options - Reference options (uses defaultOptions when not provided)
 * @returns A promise that resolves to the parsed Arazzo Document as ApiDOM data model
 * @throws ParseError - When parsing fails for any reason. The original error is available via the `cause` property.
 *
 * @example
 * Parse from object
 * ```typescript
 * const result = await parse({ arazzo: '1.0.1', info: {...} });
 * ```
 *
 * @example
 * Parse inline JSON
 * ```typescript
 * const result = await parse('{"arazzo": "1.0.1", "info": {...}}');
 * ```
 *
 * @example
 * Parse from file
 * ```typescript
 * const result = await parse('/path/to/arazzo.json');
 * ```
 *
 * @example
 * Parse from URL
 * ```typescript
 * const result = await parse('https://example.com/arazzo.yaml');
 * ```
 *
 * @example
 * Parse with custom options
 * ```typescript
 * const result = await parse('/path/to/arazzo.json', customOptions);
 * ```
 * @public
 */
export async function parse(
  source: string | Record<string, unknown>,
  options: Options = {},
): Promise<ParseResultElement> {
  const mergedOptions = mergeOptions(defaultOptions as ApiDOMReferenceOptions, options);

  // attempt to parse source as plain object
  if (isPlainObject(source)) {
    if (mergedOptions.parse?.parserOpts?.sourceMap) {
      throw new ParseError(
        'sourceMap option is not supported when parsing from object: source maps cannot be inferred from plain objects',
      );
    }
    const parseResult = new ParseResultElement();
    const element = refractArazzoSpecification1(source);
    element.classes.push('result');
    parseResult.push(element);
    return parseResult;
  }

  // next try to parse the source assuming it contains Arazzo Document
  try {
    return await parser.parse(source, {
      sourceMap: mergedOptions.parse?.parserOpts?.sourceMap,
      strict: mergedOptions.parse?.parserOpts?.strict,
    });
  } catch (error: unknown) {
    if (
      error instanceof ParserError &&
      error.message !== 'Source did not match any registered parsers'
    ) {
      throw new ParseError('Failed to parse Arazzo Document', { cause: error });
    }
  }

  // next we assume that source is either file system URI or HTTP(S) URL
  try {
    const parseResult = await parseURI(source, mergedOptions);
    parseResult.meta.set('retrievalURI', source);
    return parseResult;
  } catch (error: unknown) {
    throw new ParseError(`Failed to parse Arazzo Document from "${source}"`, { cause: error });
  }
}
