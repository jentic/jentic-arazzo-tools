import { ParseResultElement } from '@speclynx/apidom-datamodel';
import {
  parse as parseURI,
  mergeOptions,
  UnmatchedParserError,
} from '@speclynx/apidom-reference/configuration/empty';
import type { ApiDOMReferenceOptions } from '@speclynx/apidom-reference';
import ArazzoJSON1Parser from '@speclynx/apidom-reference/parse/parsers/arazzo-json-1';
import ArazzoYAML1Parser from '@speclynx/apidom-reference/parse/parsers/arazzo-yaml-1';
import OpenApiJSON2Parser from '@speclynx/apidom-reference/parse/parsers/openapi-json-2';
import OpenApiYAML2Parser from '@speclynx/apidom-reference/parse/parsers/openapi-yaml-2';
import OpenApiJSON3_0Parser from '@speclynx/apidom-reference/parse/parsers/openapi-json-3-0';
import OpenApiYAML3_0Parser from '@speclynx/apidom-reference/parse/parsers/openapi-yaml-3-0';
import OpenApiJSON3_1Parser from '@speclynx/apidom-reference/parse/parsers/openapi-json-3-1';
import OpenApiYAML3_1Parser from '@speclynx/apidom-reference/parse/parsers/openapi-yaml-3-1';
import FileResolver from '@speclynx/apidom-reference/resolve/resolvers/file';
import HTTPResolverAxios from '@speclynx/apidom-reference/resolve/resolvers/http-axios';
import { detect as detectArazzoJSON } from '@speclynx/apidom-parser-adapter-arazzo-json-1';
import { isArazzoSpecification1Element } from '@speclynx/apidom-ns-arazzo-1';
import { detect as detectArazzoYAML } from '@speclynx/apidom-parser-adapter-arazzo-yaml-1';
import { isPlainObject } from 'ramda-adjunct';
import type { PartialDeep } from 'type-fest';

import ParseError from './errors/ParseError.ts';
import MemoryResolver from './resolve/resolvers/memory/index.ts';

/**
 * Options for parsing Arazzo Documents.
 * @public
 */
export type Options = PartialDeep<ApiDOMReferenceOptions>;

/**
 * Default reference options for parsing Arazzo Documents.
 * @public
 */
export const defaultOptions: Options = {
  parse: {
    parsers: [
      new ArazzoJSON1Parser({
        allowEmpty: false,
        fileExtensions: ['.json'],
        parseFn: parseURI,
      }),
      new ArazzoYAML1Parser({
        allowEmpty: false,
        fileExtensions: ['.yaml', '.yml'],
        parseFn: parseURI,
      }),
      new OpenApiJSON2Parser({ allowEmpty: false, fileExtensions: ['.json'] }),
      new OpenApiYAML2Parser({ allowEmpty: false, fileExtensions: ['.yaml', '.yml'] }),
      new OpenApiJSON3_0Parser({ allowEmpty: false, fileExtensions: ['.json'] }),
      new OpenApiYAML3_0Parser({ allowEmpty: false, fileExtensions: ['.yaml', '.yml'] }),
      new OpenApiJSON3_1Parser({ allowEmpty: false, fileExtensions: ['.json'] }),
      new OpenApiYAML3_1Parser({ allowEmpty: false, fileExtensions: ['.yaml', '.yml'] }),
    ],
    parserOpts: {
      sourceMap: false,
      strict: true,
      sourceDescriptions: false,
    },
  },
  resolve: {
    resolvers: [
      new MemoryResolver(),
      new FileResolver({ fileAllowList: ['*.json', '*.yaml', '*.yml'] }),
      new HTTPResolverAxios({ timeout: 5000, redirects: 5, withCredentials: false }),
    ],
    resolverOpts: {},
  },
};

/**
 * Parses an Arazzo Document from an object.
 * @param source - The Arazzo Document as a plain object
 * @param options - Reference options (uses defaultOptions when not provided)
 * @returns A promise that resolves to the parsed Arazzo Document as ApiDOM data model
 * @throws ParseError - When parsing fails for any reason. The original error is available via the `cause` property.
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
 * 1. Object - converts to JSON string and parses (source maps supported with `strict: false`)
 * 2. String content - uses Arazzo detection to identify and parse inline JSON or YAML content
 * 3. URI string - if not detected as Arazzo content, treats as file system path or HTTP(S) URL
 *
 * @param source - The Arazzo Document as an object, string content, or a file system path / HTTP(S) URL
 * @param options - Reference options (uses defaultOptions when not provided)
 * @returns A promise that resolves to the parsed Arazzo Document as ApiDOM data model
 * @throws ParseError - When parsing fails for any reason. The original error is available via the `cause` property.
 *
 * @example
 * Parse from object
 * ```typescript
 * const result = await parseArazzo({ arazzo: '1.0.1', info: {...} });
 * ```
 *
 * @example
 * Parse inline JSON
 * ```typescript
 * const result = await parseArazzo('{"arazzo": "1.0.1", "info": {...}}');
 * ```
 *
 * @example
 * Parse from file
 * ```typescript
 * const result = await parseArazzo('/path/to/arazzo.json');
 * ```
 *
 * @example
 * Parse from URL
 * ```typescript
 * const result = await parseArazzo('https://example.com/arazzo.yaml');
 * ```
 *
 * @example
 * Parse with custom options
 * ```typescript
 * const result = await parseArazzo('/path/to/arazzo.json', customOptions);
 * ```
 * @public
 */
export async function parse(
  source: string | Record<string, unknown>,
  options: Options = {},
): Promise<ParseResultElement> {
  let mergedOptions = mergeOptions(defaultOptions as ApiDOMReferenceOptions, options);
  const strict = mergedOptions.parse?.parserOpts?.strict ?? true;
  let sourceProvenance: string;

  if (isPlainObject(source)) {
    const document = JSON.stringify(source, null, 2);
    mergedOptions = mergeOptions(mergedOptions, {
      resolve: { resolverOpts: { document } },
    });
    source = 'memory://arazzo.json';
    sourceProvenance = '[object]';
  } else if (await detectArazzoJSON(source, { strict })) {
    mergedOptions = mergeOptions(mergedOptions, {
      resolve: { resolverOpts: { document: source } },
    });
    source = 'memory://arazzo.json';
    sourceProvenance = '[inline JSON]';
  } else if (await detectArazzoYAML(source, { strict })) {
    mergedOptions = mergeOptions(mergedOptions, {
      resolve: { resolverOpts: { document: source } },
    });
    source = 'memory://arazzo.yaml';
    sourceProvenance = '[inline YAML]';
  } else {
    sourceProvenance = source;
  }

  // next we assume that source is either file system URI or HTTP(S) URL
  try {
    const parseResult = await parseURI(source, mergedOptions);

    // set retrievalURI metadata for file/URL sources (not for inline content)
    if (!source.startsWith('memory://')) {
      parseResult.meta.set('retrievalURI', source);
    }

    // validate that the parsed document is an Arazzo specification
    if (!isArazzoSpecification1Element(parseResult.api)) {
      throw new UnmatchedParserError(
        `Could not find a parser that can parse "${sourceProvenance}" as an Arazzo specification`,
      );
    }

    return parseResult;
  } catch (error: unknown) {
    throw new ParseError(`Failed to parse Arazzo Document from "${sourceProvenance}"`, {
      cause: error,
    });
  }
}
