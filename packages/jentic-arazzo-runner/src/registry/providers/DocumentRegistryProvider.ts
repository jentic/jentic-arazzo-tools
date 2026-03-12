import type { PartialDeep } from 'type-fest';
import type { ApiDOMReferenceOptions } from '@speclynx/apidom-reference/configuration/empty';

import type APIDocument from '../../document/APIDocument.ts';

/**
 * Options for a document registry provider.
 * @public
 */
export type DocumentRegistryProviderOptions = PartialDeep<ApiDOMReferenceOptions>;

/**
 * Base class for document registry providers.
 *
 * Subclasses implement `canProvide()` for format detection and `provide()` for loading.
 * @public
 */
abstract class DocumentRegistryProvider {
  /**
   * Checks if the content at the URI can be handled by this provider.
   */
  abstract canProvide(uri: string): Promise<boolean>;

  /**
   * Loads and produces a document from a URI.
   */
  abstract provide(uri: string): Promise<APIDocument>;
}

export default DocumentRegistryProvider;
