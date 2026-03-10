import { toValue } from '@speclynx/apidom-core';
import { parseOpenAPI } from '@jentic/arazzo-parser';
import { dereferenceOpenAPIElement } from '@jentic/arazzo-resolver';

import type {
  HttpMethod,
  OperationIndex,
  OperationLocation,
  PathMethodIndex,
  SourceDescriptionEntry,
  SourceDescriptionStoreOptions,
} from '../types.ts';
import SourceDescriptionError from '../errors/SourceDescriptionError.ts';
import LRUCache from './LRUCache.ts';

const HTTP_METHODS: HttpMethod[] = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
];

/**
 * builds operation indices by walking the paths object of an OpenAPI document POJO.
 */
function buildOperationIndices(openApiPojo: Record<string, unknown>): {
  operationIndex: OperationIndex;
  pathMethodIndex: PathMethodIndex;
} {
  const operationIndex: OperationIndex = new Map();
  const pathMethodIndex: PathMethodIndex = new Map();

  const paths = openApiPojo.paths as Record<string, Record<string, unknown>> | undefined;
  if (paths == null) {
    return { operationIndex, pathMethodIndex };
  }

  for (const [path, pathItem] of Object.entries(paths)) {
    if (pathItem == null || typeof pathItem !== 'object') continue;

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method] as Record<string, unknown> | undefined;
      if (operation == null || typeof operation !== 'object') continue;

      const operationId = operation.operationId as string | undefined;
      if (operationId == null) continue;

      const location: OperationLocation = { path, method };
      operationIndex.set(operationId, location);
      pathMethodIndex.set(`${method} ${path}`, operationId);
    }
  }

  return { operationIndex, pathMethodIndex };
}

/**
 * LRU cache for prepared OpenAPI source descriptions.
 *
 * stores parsed and dereferenced OpenAPI documents keyed by source name.
 * on cache miss, `ensure()` fetches, parses, dereferences, and builds
 * an operation index before caching.
 *
 * @public
 */
class SourceDescriptionStore {
  readonly #cache: LRUCache<string, SourceDescriptionEntry>;
  readonly #pending: Map<string, Promise<SourceDescriptionEntry>> = new Map();

  constructor(options?: SourceDescriptionStoreOptions) {
    this.#cache = new LRUCache({
      maxSize: options?.maxCacheSize ?? 1,
      onEviction: (_key, entry) => {
        options?.onEviction?.(entry);
      },
    });
  }

  get size(): number {
    return this.#cache.size;
  }

  has(sourceName: string): boolean {
    return this.#cache.has(sourceName);
  }

  get(sourceName: string): SourceDescriptionEntry | undefined {
    return this.#cache.get(sourceName);
  }

  /**
   * ensures a source description is ready in the cache.
   * on miss: fetches, parses, dereferences, builds operation index.
   * concurrent calls for the same source are coalesced into a single load.
   */
  async ensure(sourceName: string, sourceUrl: string): Promise<SourceDescriptionEntry> {
    const cached = this.#cache.get(sourceName);
    if (cached !== undefined) {
      return cached;
    }

    // coalesce concurrent loads for the same source
    const pending = this.#pending.get(sourceName);
    if (pending !== undefined) {
      return pending;
    }

    const loading = this.#load(sourceName, sourceUrl);
    this.#pending.set(sourceName, loading);

    try {
      const entry = await loading;
      this.#cache.set(sourceName, entry);
      return entry;
    } finally {
      this.#pending.delete(sourceName);
    }
  }

  /**
   * searches all cached entries for an operationId.
   * returns the source name and operation location if found.
   */
  findOperation(
    operationId: string,
  ): { sourceName: string; location: OperationLocation } | undefined {
    for (const [sourceName, entry] of this.#entries()) {
      const location = entry.operationIndex.get(operationId);
      if (location !== undefined) {
        return { sourceName, location };
      }
    }

    return undefined;
  }

  clear(): void {
    this.#cache.clear();
  }

  async #load(sourceName: string, sourceUrl: string): Promise<SourceDescriptionEntry> {
    try {
      const parseResult = await parseOpenAPI(sourceUrl);
      const dereferenced = await dereferenceOpenAPIElement(parseResult);
      const api = dereferenced.api;

      if (api === undefined) {
        throw new SourceDescriptionError(
          `Source description "${sourceName}" from "${sourceUrl}" produced an empty parse result`,
        );
      }

      const openApiPojo = toValue(api) as Record<string, unknown>;
      const { operationIndex, pathMethodIndex } = buildOperationIndices(openApiPojo);

      return {
        sourceName,
        resolvedUrl: sourceUrl,
        semanticOpenApiDoc: api,
        parseResult: dereferenced,
        operationIndex,
        pathMethodIndex,
      };
    } catch (error: unknown) {
      throw new SourceDescriptionError(
        `Failed to load source description "${sourceName}" from "${sourceUrl}"`,
        { cause: error },
      );
    }
  }

  *#entries(): IterableIterator<[string, SourceDescriptionEntry]> {
    yield* this.#cache;
  }
}

export default SourceDescriptionStore;
