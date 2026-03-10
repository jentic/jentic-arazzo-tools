/**
 * options for creating an LRU cache.
 * @public
 */
interface LRUCacheOptions<K, V> {
  readonly maxSize: number;
  readonly onEviction?: (key: K, value: V) => void;
}

/**
 * bounded LRU cache backed by a single Map.
 *
 * leverages the fact that Map preserves insertion order:
 * the first entry is always the least-recently-used.
 * on read, entries are deleted and re-inserted to move them to the end.
 * on write at capacity, the first entry is evicted before inserting.
 *
 * memory is strictly bounded to `maxSize` entries at all times.
 *
 * @public
 */
class LRUCache<K, V> extends Map<K, V> {
  readonly #maxSize: number;
  readonly #onEviction?: (key: K, value: V) => void;

  constructor(options: LRUCacheOptions<K, V>) {
    super();

    if (!(options.maxSize && options.maxSize > 0)) {
      throw new TypeError('`maxSize` must be a number greater than 0');
    }

    this.#maxSize = options.maxSize;
    this.#onEviction = options.onEviction;
  }

  #evictOldest(): void {
    const oldest = super.keys().next();
    if (oldest.done) return;

    const key = oldest.value;
    const value = super.get(key)!;
    super.delete(key);

    if (typeof this.#onEviction === 'function') {
      this.#onEviction(key, value);
    }
  }

  get(key: K): V | undefined {
    if (!super.has(key)) {
      return undefined;
    }

    // delete and re-insert to move to end (most-recently-used)
    const value = super.get(key)!;
    super.delete(key);
    super.set(key, value);
    return value;
  }

  set(key: K, value: V): this {
    // if key already exists, delete first so re-insert moves it to end
    if (super.has(key)) {
      super.delete(key);
    } else if (super.size >= this.#maxSize) {
      this.#evictOldest();
    }

    super.set(key, value);
    return this;
  }

  get maxSize(): number {
    return this.#maxSize;
  }
}

export default LRUCache;
