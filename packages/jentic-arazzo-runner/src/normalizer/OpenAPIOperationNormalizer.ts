import {
  isSwaggerElement,
  type OperationElement as OperationElement2,
} from '@speclynx/apidom-ns-openapi-2';
import {
  isOpenApi3_0Element,
  type OperationElement as OperationElement30,
} from '@speclynx/apidom-ns-openapi-3-0';
import {
  isOpenApi3_1Element,
  type OperationElement as OperationElement31,
} from '@speclynx/apidom-ns-openapi-3-1';

import type { OpenAPIOperationElement } from '../document/openapi-types.ts';
import type OpenAPIDocument from '../document/OpenAPIDocument.ts';
import NormalizationError from '../errors/NormalizationError.ts';
import OpenAPI2OperationNormalizer from './OpenAPI2OperationNormalizer.ts';
import OpenAPI30OperationNormalizer from './OpenAPI30OperationNormalizer.ts';
import OpenAPI31OperationNormalizer from './OpenAPI31OperationNormalizer.ts';

/**
 * Options for the OpenAPI operation normalizer facade.
 * @public
 */
export interface OpenAPIOperationNormalizerOptions {
  readonly openapi2?: OpenAPI2OperationNormalizer;
  readonly openapi30?: OpenAPI30OperationNormalizer;
  readonly openapi31?: OpenAPI31OperationNormalizer;
}

/**
 * Facade for normalizing OpenAPI operations across all supported versions.
 *
 * Detects the OpenAPI version from the document and delegates to the
 * appropriate version-specific normalizer (2.0, 3.0, or 3.1).
 *
 * Custom normalizer instances can be provided via constructor options.
 * @public
 */
class OpenAPIOperationNormalizer {
  readonly #openapi2: OpenAPI2OperationNormalizer;
  readonly #openapi30: OpenAPI30OperationNormalizer;
  readonly #openapi31: OpenAPI31OperationNormalizer;

  constructor(options: OpenAPIOperationNormalizerOptions = {}) {
    this.#openapi2 = options.openapi2 ?? new OpenAPI2OperationNormalizer();
    this.#openapi30 = options.openapi30 ?? new OpenAPI30OperationNormalizer();
    this.#openapi31 = options.openapi31 ?? new OpenAPI31OperationNormalizer();
  }

  /**
   * Normalizes the operation by delegating to the version-specific normalizer.
   */
  async normalize(
    operation: OpenAPIOperationElement,
    document: OpenAPIDocument,
  ): Promise<OpenAPIOperationElement> {
    const root = document.parseResult.api;

    if (isSwaggerElement(root)) {
      return this.#openapi2.normalize(operation as OperationElement2, document);
    }
    if (isOpenApi3_0Element(root)) {
      return this.#openapi30.normalize(operation as OperationElement30, document);
    }
    if (isOpenApi3_1Element(root)) {
      return this.#openapi31.normalize(operation as OperationElement31, document);
    }

    throw new NormalizationError(`Unsupported OpenAPI version in document at "${document.uri}"`, {
      uri: document.uri,
    });
  }
}

export default OpenAPIOperationNormalizer;
