import type { Element, ParseResultElement } from '@speclynx/apidom-datamodel';

/**
 * supported HTTP methods for OpenAPI operations.
 * @public
 */
export type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

/**
 * location of an operation within an OpenAPI document.
 * @public
 */
export interface OperationLocation {
  readonly path: string;
  readonly method: HttpMethod;
}

/**
 * index mapping operationId values to their locations.
 * @public
 */
export type OperationIndex = Map<string, OperationLocation>;

/**
 * reverse index mapping "method path" keys to operationIds.
 * @public
 */
export type PathMethodIndex = Map<string, string>;

/**
 * an LRU cache entry for a prepared OpenAPI source description.
 * @public
 */
export interface SourceDescriptionEntry {
  readonly sourceName: string;
  readonly resolvedUrl: string;
  readonly semanticOpenApiDoc: Element;
  readonly parseResult: ParseResultElement;
  readonly operationIndex: OperationIndex;
  readonly pathMethodIndex: PathMethodIndex;
}

/**
 * configuration options for the source description store.
 * @public
 */
export interface SourceDescriptionStoreOptions {
  readonly maxCacheSize?: number;
  readonly onEviction?: (entry: SourceDescriptionEntry) => void;
}
