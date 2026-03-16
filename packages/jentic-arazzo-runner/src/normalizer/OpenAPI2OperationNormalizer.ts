import { toValue } from '@speclynx/apidom-core';
import {
  dereferenceOpenAPIElement,
  defaultDereferenceOpenAPIOptions,
} from '@jentic/arazzo-resolver';
import {
  mergeOptions,
  type ApiDOMReferenceOptions,
} from '@speclynx/apidom-reference/configuration/empty';
import OpenAPI2DereferenceStrategy from '@speclynx/apidom-reference/dereference/strategies/openapi-2';
import type { PartialDeep } from 'type-fest';
import type { OperationElement } from '@speclynx/apidom-ns-openapi-2';

import type OpenAPIDocument from '../document/OpenAPIDocument.ts';
import NormalizationError from '../errors/NormalizationError.ts';
import { providerOptionsOverride as openAPIProviderOptions } from '../registry/providers/OpenAPIDocumentRegistryProvider.ts';

/**
 * Options for normalizing an OpenAPI 2.0 operation.
 * @public
 */
export type OpenAPI2OperationNormalizerOptions = PartialDeep<ApiDOMReferenceOptions>;

const normalizerOptionsOverride = mergeOptions(openAPIProviderOptions as ApiDOMReferenceOptions, {
  dereference: {
    strategies: [new OpenAPI2DereferenceStrategy()],
    immutable: false,
  },
});

/**
 * Version-specific normalization for OpenAPI 2.0 (Swagger) operations.
 *
 * Dereferences the operation subtree and handles merging of
 * host/basePath/schemes and security from root level.
 * OpenAPI 2.0 does not support servers at path item or operation level.
 * @public
 */
class OpenAPI2OperationNormalizer {
  readonly #options: ApiDOMReferenceOptions;

  constructor(options: OpenAPI2OperationNormalizerOptions = {}) {
    this.#options = mergeOptions(normalizerOptionsOverride, options);
  }

  async normalize(
    operation: OperationElement,
    document: OpenAPIDocument,
  ): Promise<OperationElement> {
    const normalized = await this.#dereference(operation, document);

    // TODO: resolve host + basePath + schemes from root into absolute server URLs
    // TODO: merge security (operation → root)
    // TODO: merge parameters (pathItem + operation, deduped by name+in)

    return normalized;
  }

  async #dereference(
    operation: OperationElement,
    document: OpenAPIDocument,
  ): Promise<OperationElement> {
    try {
      return await dereferenceOpenAPIElement(
        operation,
        mergeOptions(
          defaultDereferenceOpenAPIOptions as ApiDOMReferenceOptions,
          mergeOptions(this.#options, {
            resolve: { baseURI: document.uri },
            dereference: {
              strategyOpts: { parseResult: document.parseResult },
            },
          }),
        ),
      );
    } catch (error: unknown) {
      throw new NormalizationError(
        `Failed to normalize operation "${toValue(operation.operationId)}" in OpenAPI 2.0 document at "${document.uri}"`,
        { cause: error, operationId: toValue(operation.operationId), uri: document.uri },
      );
    }
  }
}

export default OpenAPI2OperationNormalizer;
