import {
  mergeOptions,
  readFile,
  File,
  type ApiDOMReferenceOptions,
} from '@speclynx/apidom-reference/configuration/empty';
import type { PartialDeep } from 'type-fest';

import type APIDocument from '../documents/Document.ts';

/**
 * Options for a document registry provider.
 * @public
 */
export type DocumentRegistryProviderOptions = PartialDeep<ApiDOMReferenceOptions>;

/**
 * Base class for document registry providers.
 *
 * Handles options merging and parser-based format detection.
 * Subclasses implement `provide()` and specify a parser name prefix for detection.
 * @public
 */
abstract class DocumentRegistryProvider {
  readonly options: ApiDOMReferenceOptions;

  protected constructor(
    defaultOptions: DocumentRegistryProviderOptions,
    options: DocumentRegistryProviderOptions = {},
  ) {
    this.options = mergeOptions(defaultOptions as ApiDOMReferenceOptions, options);
  }

  /**
   * Returns the parser name prefix used for format detection.
   */
  protected abstract get parserNamePrefix(): string;

  /**
   * Checks if the content at the URI can be handled by this provider.
   */
  async canProvide(uri: string): Promise<boolean> {
    const data = await readFile(uri, this.options);
    const file = new File({ uri, data });
    const parsers = this.options.parse.parsers.filter((p) =>
      p.name.startsWith(this.parserNamePrefix),
    );
    for (const parser of parsers) {
      if (await parser.canParse(file)) return true;
    }
    return false;
  }

  /**
   * Loads and produces a document from a URI.
   */
  abstract provide(uri: string): Promise<APIDocument>;
}

export default DocumentRegistryProvider;
