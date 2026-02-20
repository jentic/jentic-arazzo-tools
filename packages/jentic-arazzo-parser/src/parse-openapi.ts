import { ParseResultElement } from '@speclynx/apidom-datamodel';
import { parse as parseURI, mergeOptions } from '@speclynx/apidom-reference/configuration/empty';
import type { ApiDOMReferenceOptions } from '@speclynx/apidom-reference';
import OpenApiJSON2Parser from '@speclynx/apidom-reference/parse/parsers/openapi-json-2';
import OpenApiYAML2Parser from '@speclynx/apidom-reference/parse/parsers/openapi-yaml-2';
import OpenApiJSON3_0Parser from '@speclynx/apidom-reference/parse/parsers/openapi-json-3-0';
import OpenApiYAML3_0Parser from '@speclynx/apidom-reference/parse/parsers/openapi-yaml-3-0';
import OpenApiJSON3_1Parser from '@speclynx/apidom-reference/parse/parsers/openapi-json-3-1';
import OpenApiYAML3_1Parser from '@speclynx/apidom-reference/parse/parsers/openapi-yaml-3-1';
import FileResolver from '@speclynx/apidom-reference/resolve/resolvers/file';
import HTTPResolverAxios from '@speclynx/apidom-reference/resolve/resolvers/http-axios';
import { detect as detectOpenApiJSON3_1 } from '@speclynx/apidom-parser-adapter-openapi-json-3-1';
import { detect as detectOpenApiYAML3_1 } from '@speclynx/apidom-parser-adapter-openapi-yaml-3-1';
import { detect as detectOpenApiJSON3_0 } from '@speclynx/apidom-parser-adapter-openapi-json-3-0';
import { detect as detectOpenApiYAML3_0 } from '@speclynx/apidom-parser-adapter-openapi-yaml-3-0';
import { detect as detectOpenApiJSON2 } from '@speclynx/apidom-parser-adapter-openapi-json-2';
import { detect as detectOpenApiYAML2 } from '@speclynx/apidom-parser-adapter-openapi-yaml-2';
import { isPlainObject } from 'ramda-adjunct';
import type { PartialDeep } from 'type-fest';

import ParseError from './errors/ParseError.ts';
import MemoryResolver from './resolve/resolvers/memory/index.ts';

/**
 * Options for parsing OpenAPI Documents.
 * @public
 */
export type Options = PartialDeep<ApiDOMReferenceOptions>;

/**
 * Default reference options for parsing OpenAPI Documents.
 * @public
 */
export const defaultOptions: Options = {
  parse: {
    parsers: [
      new OpenApiJSON2Parser({ allowEmpty: false, fileExtensions: ['.json'] }),
      new OpenApiYAML2Parser({ allowEmpty: false, fileExtensions: ['.yaml', '.yml'] }),
      new OpenApiJSON3_0Parser({ allowEmpty: false, fileExtensions: ['.json'] }),
      new OpenApiYAML3_0Parser({ allowEmpty: false, fileExtensions: ['.yaml', '.yml'] }),
      new OpenApiJSON3_1Parser({ allowEmpty: false, fileExtensions: ['.json'] }),
      new OpenApiYAML3_1Parser({ allowEmpty: false, fileExtensions: ['.yaml', '.yml'] }),
    ],
    parserOpts: {
      sourceMap: false,
      style: false,
      strict: true,
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
 * Parses an OpenAPI Document from an object.
 * @param source - The OpenAPI Document as a plain object
 * @param options - Reference options (uses defaultOptions when not provided)
 * @returns A promise that resolves to the parsed OpenAPI Document as ApiDOM data model
 * @throws ParseError - When parsing fails for any reason. The original error is available via the `cause` property.
 * @public
 */
export async function parse(
  source: Record<string, unknown>,
  options?: Options,
): Promise<ParseResultElement>;
/**
 * Parses an OpenAPI Document from a string or URI.
 * @param source - The OpenAPI Document as string content, or a file system path / HTTP(S) URL
 * @param options - Reference options (uses defaultOptions when not provided)
 * @returns A promise that resolves to the parsed OpenAPI Document as ApiDOM data model
 * @throws ParseError - When parsing fails for any reason. The original error is available via the `cause` property.
 * @public
 */
export async function parse(source: string, options?: Options): Promise<ParseResultElement>;
/**
 * Parses an OpenAPI Document from a string, object, or URI.
 *
 * The function handles three types of input:
 * 1. Object - converts to JSON string and parses (source maps supported with `strict: false`)
 * 2. String content - uses OpenAPI detection to identify and parse inline JSON or YAML content
 * 3. URI string - if not detected as OpenAPI content, treats as file system path or HTTP(S) URL
 *
 * @param source - The OpenAPI Document as an object, string content, or a file system path / HTTP(S) URL
 * @param options - Reference options (uses defaultOptions when not provided)
 * @returns A promise that resolves to the parsed OpenAPI Document as ApiDOM data model
 * @throws ParseError - When parsing fails for any reason. The original error is available via the `cause` property.
 *
 * @example
 * Parse from object
 * ```typescript
 * const result = await parseOpenAPI({ openapi: '3.1.0', info: {...} });
 * ```
 *
 * @example
 * Parse inline JSON
 * ```typescript
 * const result = await parseOpenAPI('{"openapi": "3.1.0", "info": {...}}');
 * ```
 *
 * @example
 * Parse from file
 * ```typescript
 * const result = await parseOpenAPI('/path/to/openapi.json');
 * ```
 *
 * @example
 * Parse from URL
 * ```typescript
 * const result = await parseOpenAPI('https://example.com/openapi.yaml');
 * ```
 *
 * @example
 * Parse with custom options
 * ```typescript
 * const result = await parseOpenAPI('/path/to/openapi.json', customOptions);
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
    source = 'memory://openapi.json';
    sourceProvenance = '[object]';
  } else if (await detectOpenApiJSON2(source, { strict })) {
    mergedOptions = mergeOptions(mergedOptions, {
      resolve: { resolverOpts: { document: source } },
    });
    source = 'memory://openapi.json';
    sourceProvenance = '[inline JSON]';
  } else if (await detectOpenApiYAML2(source, { strict })) {
    mergedOptions = mergeOptions(mergedOptions, {
      resolve: { resolverOpts: { document: source } },
    });
    source = 'memory://openapi.yaml';
    sourceProvenance = '[inline YAML]';
  } else if (await detectOpenApiJSON3_0(source, { strict })) {
    mergedOptions = mergeOptions(mergedOptions, {
      resolve: { resolverOpts: { document: source } },
    });
    source = 'memory://openapi.json';
    sourceProvenance = '[inline JSON]';
  } else if (await detectOpenApiYAML3_0(source, { strict })) {
    mergedOptions = mergeOptions(mergedOptions, {
      resolve: { resolverOpts: { document: source } },
    });
    source = 'memory://openapi.yaml';
    sourceProvenance = '[inline YAML]';
  } else if (await detectOpenApiJSON3_1(source, { strict })) {
    mergedOptions = mergeOptions(mergedOptions, {
      resolve: { resolverOpts: { document: source } },
    });
    source = 'memory://openapi.json';
    sourceProvenance = '[inline JSON]';
  } else if (await detectOpenApiYAML3_1(source, { strict })) {
    mergedOptions = mergeOptions(mergedOptions, {
      resolve: { resolverOpts: { document: source } },
    });
    source = 'memory://openapi.yaml';
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

    return parseResult;
  } catch (error: unknown) {
    throw new ParseError(`Failed to parse OpenAPI Document from "${sourceProvenance}"`, {
      cause: error,
    });
  }
}
