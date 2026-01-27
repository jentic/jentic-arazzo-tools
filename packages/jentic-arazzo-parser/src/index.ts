import { ParseResultElement } from '@speclynx/apidom-datamodel';
import { refractArazzoSpecification1 } from '@speclynx/apidom-ns-arazzo-1';
import ApiDOMParser, { ParserError } from '@speclynx/apidom-parser';
import * as jsonParserAdapter from '@speclynx/apidom-parser-adapter-arazzo-json-1';
import * as yamlParserAdapter from '@speclynx/apidom-parser-adapter-arazzo-yaml-1';
import { parse as parseURI } from '@speclynx/apidom-reference/configuration/empty';
import ArazzoJSON1Parser from '@speclynx/apidom-reference/parse/parsers/arazzo-json-1';
import ArazzoYAML1Parser from '@speclynx/apidom-reference/parse/parsers/arazzo-yaml-1';
import FileResolver from '@speclynx/apidom-reference/resolve/resolvers/file';
import HTTPResolverAxios from '@speclynx/apidom-reference/resolve/resolvers/http-axios';

import ParseError from './errors/ParseError.ts';

/**
 * Options for parsing Arazzo Documents.
 * @public
 */
export interface ParseOptions {
  /**
   * Whether to enforce strict parsing mode.
   * Strict parsing mode is using native JSON and YAML parsers without source maps and error recovery.
   * @defaultValue true
   */
  readonly strict?: boolean;
  /**
   * Whether to include source maps in the parsed result.
   * @defaultValue false
   */
  readonly sourceMap?: boolean;
  /**
   * Additional options passed to the underlying parsers.
   * @defaultValue \{\}
   */
  readonly parserOpts?: Record<string, unknown>;
  /**
   * Additional options passed to the underlying resolvers.
   * @defaultValue \{\}
   */
  readonly resolverOpts?: Record<string, unknown>;
}

/**
 * Default options for parsing Arazzo Documents.
 * @public
 */
export const defaultParseOptions: Required<ParseOptions> = {
  strict: true,
  sourceMap: false,
  parserOpts: {},
  resolverOpts: {},
};

const parser = new ApiDOMParser();
parser.use(jsonParserAdapter);
parser.use(yamlParserAdapter);

/**
 * Parses an Arazzo Document from an object.
 * @param source - The Arazzo Document as a plain object
 * @param options - Parsing options
 * @returns A promise that resolves to the parsed Arazzo Document as ApiDOM data model
 * @public
 */
export async function parse(
  source: Record<string, unknown>,
  options?: ParseOptions,
): Promise<ParseResultElement>;
/**
 * Parses an Arazzo Document from a string or URI.
 * @param source - The Arazzo Document as string content, or a file system path / HTTP(S) URL
 * @param options - Parsing options
 * @returns A promise that resolves to the parsed Arazzo Document as ApiDOM data model
 * @throws ParseError - When parsing fails for any reason. The original error is available via the `cause` property.
 * @public
 */
export async function parse(source: string, options?: ParseOptions): Promise<ParseResultElement>;
/**
 * Parses an Arazzo Document from a string, object, or URI.
 *
 * The function handles three types of input:
 * 1. Object - directly refracts the object into an Arazzo specification element
 * 2. String content - attempts to parse as an inline Arazzo Document (JSON or YAML)
 * 3. URI string - treats as a file system path or HTTP(S) URL and resolves the document
 *
 * @param source - The Arazzo Document as an object, string content, or a file system path / HTTP(S) URL
 * @param options - Parsing options
 * @returns A promise that resolves to the parsed Arazzo Document as ApiDOM data model
 * @throws ParseError - When parsing fails for any reason. The original error is available via the `cause` property.
 *
 * @example
 * // Parse from object
 * const result = await parse(\{ arazzo: '1.0.1', info: \{...\} \});
 *
 * @example
 * // Parse inline JSON
 * const result = await parse('\{"arazzo": "1.0.1", "info": \{...\}\}');
 *
 * @example
 * // Parse from file
 * const result = await parse('/path/to/arazzo.json');
 *
 * @example
 * // Parse from URL
 * const result = await parse('https://example.com/arazzo.yaml');
 * @public
 */
export async function parse(
  source: string | Record<string, unknown>,
  options: ParseOptions = {},
): Promise<ParseResultElement> {
  const mergedOptions = { ...defaultParseOptions, ...options };
  const { strict, sourceMap, parserOpts, resolverOpts } = mergedOptions;

  // attempt to parse source as object
  if (typeof source === 'object' && source !== null) {
    const parseResult = new ParseResultElement();
    const element = refractArazzoSpecification1(source);
    element.classes.push('result');
    parseResult.push(element);
    return parseResult;
  }

  // next try to parse the source assuming it contains Arazzo Document
  try {
    return await parser.parse(source, { sourceMap, strict });
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
    return await parseURI(source, {
      parse: {
        parsers: [
          new ArazzoJSON1Parser({ allowEmpty: false, sourceMap, strict }),
          new ArazzoYAML1Parser({ allowEmpty: false, sourceMap, strict }),
        ],
        parserOpts,
      },
      resolve: {
        resolvers: [
          new FileResolver({ fileAllowList: ['*.json', '*.yaml', '*.yml'] }),
          new HTTPResolverAxios({ timeout: 5000, redirects: 5, withCredentials: false }),
        ],
        resolverOpts,
      },
    });
  } catch (error: unknown) {
    throw new ParseError('Failed to parse Arazzo Document from URI', { cause: error });
  }
}
