import { toValue } from '@speclynx/apidom-core';
import {
  dereferenceOpenAPIElement,
  defaultDereferenceOpenAPIOptions,
} from '@jentic/arazzo-resolver';
import {
  mergeOptions,
  type ApiDOMReferenceOptions,
} from '@speclynx/apidom-reference/configuration/empty';
import type { PartialDeep } from 'type-fest';

import type { OpenAPIOperationElement } from '../document/openapi-types.ts';
import type OpenAPIDocument from '../document/OpenAPIDocument.ts';
import NormalizationError from '../errors/NormalizationError.ts';
import { providerOptionsOverride as openAPIProviderOptions } from '../registry/providers/OpenAPIDocumentRegistryProvider.ts';

/**
 * Options for normalizing an OpenAPI operation.
 * @public
 */
export type OpenAPIOperationNormalizerOptions = PartialDeep<ApiDOMReferenceOptions>;

/**
 * Default options for normalizing an OpenAPI operation.
 */
const normalizerOptionsOverride = mergeOptions(openAPIProviderOptions as ApiDOMReferenceOptions, {
  dereference: {
    immutable: false,
  },
});

/**
 * Normalizes an extracted OpenAPI operation.
 *
 * Dereferences the operation subtree ($ref references),
 * producing a self-contained operation element.
 *
 * By default, dereferencing mutates the operation element in-place
 * (immutable: false). This allows the document registry to act as
 * a natural cache — subsequent accesses return the already-dereferenced
 * operation without additional processing.
 * @public
 */
class OpenAPIOperationNormalizer {
  readonly #options: ApiDOMReferenceOptions;

  constructor(options: OpenAPIOperationNormalizerOptions = {}) {
    this.#options = mergeOptions(normalizerOptionsOverride as ApiDOMReferenceOptions, options);
  }

  /**
   * Normalizes the operation: dereferences subtree, merges inherited properties.
   */
  async normalize(
    operation: OpenAPIOperationElement,
    document: OpenAPIDocument,
  ): Promise<OpenAPIOperationElement> {
    const normalized = await this.#dereference(operation, document);

    // TODO: merge servers (operation → pathItem → root)
    // TODO: merge parameters (pathItem + operation, deduped by name+in)
    // TODO: merge security (operation → root)

    return normalized;
  }

  async #dereference(
    operation: OpenAPIOperationElement,
    document: OpenAPIDocument,
  ): Promise<OpenAPIOperationElement> {
    try {
      return await dereferenceOpenAPIElement(
        operation,
        mergeOptions(
          defaultDereferenceOpenAPIOptions as ApiDOMReferenceOptions,
          mergeOptions(this.#options, {
            dereference: {
              strategyOpts: { parseResult: document.parseResult },
            },
          }),
        ),
      );
    } catch (error: unknown) {
      throw new NormalizationError(
        `Failed to normalize operation "${toValue(operation.operationId)}" in OpenAPI document at "${document.uri}"`,
        { cause: error, operationId: toValue(operation.operationId), uri: document.uri },
      );
    }
  }
}

export default OpenAPIOperationNormalizer;
