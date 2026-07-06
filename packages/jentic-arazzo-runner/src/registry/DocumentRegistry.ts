import { url } from '@speclynx/apidom-reference/configuration/empty';

import type APIDocument from '../document/APIDocument.ts';
import ArazzoDocument from '../document/ArazzoDocument.ts';
import type DocumentRegistryProvider from './providers/DocumentRegistryProvider.ts';
import ArazzoDocumentRegistryProvider from './providers/ArazzoDocumentRegistryProvider.ts';
import OpenAPIDocumentRegistryProvider from './providers/OpenAPIDocumentRegistryProvider.ts';
import InvalidEntryDocumentError from '../errors/InvalidEntryDocumentError.ts';
import UnmatchedProviderError from '../errors/UnmatchedProviderError.ts';
import * as constants from '../constants.ts';

/**
 * Options for the DocumentRegistry.
 * @public
 */
export interface DocumentRegistryOptions {
  readonly providers?: DocumentRegistryProvider[];
}

/**
 * Registry for API documents keyed by canonical URI.
 *
 * Acts as an LRU cache for parsed documents. The entry Arazzo document
 * is pinned and never evicted. Providers are tried in order to detect
 * and load documents.
 * @public
 */
class DocumentRegistry {
  readonly #documents: Map<string, APIDocument> = new Map();
  readonly #providers: DocumentRegistryProvider[];

  constructor(options: DocumentRegistryOptions = {}) {
    this.#providers = options.providers ?? [
      new ArazzoDocumentRegistryProvider(),
      new OpenAPIDocumentRegistryProvider(),
    ];
  }

  /**
   * Returns the entry Arazzo document, or undefined if not yet registered.
   */
  get entryDocument(): ArazzoDocument | undefined {
    for (const doc of this.#documents.values()) {
      if (ArazzoDocument.is(doc) && doc.isEntry) {
        return doc;
      }
    }
    return undefined;
  }

  /**
   * Acquires a document by URI. Returns cached document if available,
   * otherwise detects the format, loads via the matching provider,
   * caches, and returns it.
   */
  async acquire(uri: string): Promise<APIDocument> {
    const canonicalURI = url.sanitize(url.stripHash(uri));
    const cachedDocument = this.#get(canonicalURI);
    if (cachedDocument) return cachedDocument;

    for (const provider of this.#providers) {
      if (await provider.canProvide(canonicalURI)) {
        const document = await provider.provide(canonicalURI);
        this.#set(canonicalURI, document);
        return document;
      }
    }

    throw new UnmatchedProviderError(`No provider can handle the document at "${canonicalURI}"`, {
      uri: canonicalURI,
    });
  }

  /**
   * Returns an already-loaded document by URI, or undefined if not cached.
   *
   * Synchronous read-only counterpart to `acquire`: it never loads a document,
   * only returns one the registry already holds. Consumers that must resolve a
   * reference without awaiting (e.g. runtime expression evaluation) use this;
   * the executor is responsible for having acquired the document beforehand.
   */
  get(uri: string): APIDocument | undefined {
    return this.#get(url.sanitize(url.stripHash(uri)));
  }

  /**
   * Acquires the entry Arazzo document and marks it with `isEntry: true`.
   * Validates that the document is an Arazzo specification.
   */
  async acquireEntryDocument(uri: string): Promise<ArazzoDocument> {
    const document = await this.acquire(uri);
    if (!ArazzoDocument.is(document)) {
      throw new InvalidEntryDocumentError(`Entry document at "${uri}" is not an Arazzo Document`, {
        uri,
      });
    }
    document.isEntry = true;
    return document;
  }

  clear(): void {
    this.#documents.clear();
  }

  /**
   * Retrieves a document and marks it as recently used.
   */
  #get(uri: string): APIDocument | undefined {
    const doc = this.#documents.get(uri);
    if (doc === undefined) return undefined;

    // move to end (most recently used)
    this.#documents.delete(uri);
    this.#documents.set(uri, doc);
    return doc;
  }

  /**
   * Registers a document in the registry.
   *
   * If the registry is at capacity, the least recently used document
   * is evicted. The entry Arazzo document is never evicted.
   */
  #set(uri: string, document: APIDocument): void {
    if (this.#documents.has(uri)) {
      this.#documents.delete(uri);
    } else if (this.#documents.size >= constants.MAX_DOCUMENT_REGISTRY_SIZE) {
      this.#evictOldest();
    }
    this.#documents.set(uri, document);
  }

  /**
   * Removes a document from the registry.
   * The entry document cannot be removed.
   */
  #delete(uri: string): boolean {
    const doc = this.#documents.get(uri);
    if (doc && ArazzoDocument.is(doc) && doc.isEntry) {
      return false;
    }
    return this.#documents.delete(uri);
  }

  #evictOldest(): void {
    for (const [uri] of this.#documents) {
      if (this.#delete(uri)) return;
    }
  }
}

export default DocumentRegistry;
