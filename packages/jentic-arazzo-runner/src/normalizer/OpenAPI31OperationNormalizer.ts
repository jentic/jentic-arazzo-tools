import { toValue } from '@speclynx/apidom-core';
import {
  dereferenceOpenAPIElement,
  defaultDereferenceOpenAPIOptions,
} from '@jentic/arazzo-resolver';
import {
  mergeOptions,
  type ApiDOMReferenceOptions,
} from '@speclynx/apidom-reference/configuration/empty';
import OpenAPI31DereferenceStrategy from '@speclynx/apidom-reference/dereference/strategies/openapi-3-1';
import type { PartialDeep } from 'type-fest';
import type { OperationElement } from '@speclynx/apidom-ns-openapi-3-1';

import type OpenAPIDocument from '../document/OpenAPIDocument.ts';
import NormalizationError from '../errors/NormalizationError.ts';
import { providerOptionsOverride as openAPIProviderOptions } from '../registry/providers/OpenAPIDocumentRegistryProvider.ts';

/**
 * Options for normalizing an OpenAPI 3.1 operation.
 * @public
 */
export type OpenAPI31OperationNormalizerOptions = PartialDeep<ApiDOMReferenceOptions>;

const normalizerOptionsOverride = mergeOptions(openAPIProviderOptions as ApiDOMReferenceOptions, {
  dereference: {
    strategies: [new OpenAPI31DereferenceStrategy()],
    immutable: false,
  },
});

/**
 * Version-specific normalization for OpenAPI 3.1 operations.
 *
 * Dereferences the operation subtree and handles merging of servers,
 * parameters, and security from path item and root levels.
 * Same inheritance rules as 3.0 but with JSON Schema $id semantics
 * for schema resolution.
 * @public
 */
class OpenAPI31OperationNormalizer {
  readonly #options: ApiDOMReferenceOptions;

  constructor(options: OpenAPI31OperationNormalizerOptions = {}) {
    this.#options = mergeOptions(normalizerOptionsOverride, options);
  }

  async normalize(
    operation: OperationElement,
    document: OpenAPIDocument,
  ): Promise<OperationElement> {
    const normalized = await this.#dereference(operation, document);

    // TODO: merge servers (operation → pathItem → root), resolve relative URLs against document.uri
    // TODO: merge parameters (pathItem + operation, deduped by name+in)
    // TODO: merge security (operation → root)

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
        `Failed to normalize operation "${toValue(operation.operationId)}" in OpenAPI 3.1 document at "${document.uri}"`,
        { cause: error, operationId: toValue(operation.operationId), uri: document.uri },
      );
    }
  }
}

export default OpenAPI31OperationNormalizer;
