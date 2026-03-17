import type { PartialDeep } from 'type-fest';
import type { ApiDOMReferenceOptions } from '@speclynx/apidom-reference/configuration/empty';
import { ObjectElement, type RefElement } from '@speclynx/apidom-datamodel';

import type APIDocument from '../../document/APIDocument.ts';

/**
 * Replaces circular $ref references with an empty ObjectElement
 * annotated with the original $ref value. This ensures the dereferenced
 * output is a finite tree safe for downstream tools.
 * @param ref - The RefElement being replaced at the cycle boundary.
 * @public
 */
export const circularReplacer = (ref: RefElement) =>
  new ObjectElement({ 'x-circular': ref.meta.get('$ref') });

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
