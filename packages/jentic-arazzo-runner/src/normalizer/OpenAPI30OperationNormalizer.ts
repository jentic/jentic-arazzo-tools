import { toValue } from '@speclynx/apidom-core';
import { isArrayElement } from '@speclynx/apidom-datamodel';
import {
  dereferenceOpenAPIElement,
  defaultDereferenceOpenAPIOptions,
} from '@jentic/arazzo-resolver';
import {
  mergeOptions,
  type ApiDOMReferenceOptions,
} from '@speclynx/apidom-reference/configuration/empty';
import {
  evaluate,
  parse,
  compile,
  testJSONPointer,
  type JSONPointer,
} from '@speclynx/apidom-json-pointer';
import OpenAPI30DereferenceStrategy from '@speclynx/apidom-reference/dereference/strategies/openapi-3-0';
import type { PartialDeep } from 'type-fest';
import {
  isPathItemElement,
  refractorPluginNormalizeServers,
  refractorPluginNormalizeParameters,
  refractorPluginNormalizeSecurityRequirements,
  type OpenApi3_0Element,
  type OperationElement,
  type PathItemElement,
} from '@speclynx/apidom-ns-openapi-3-0';

import type OpenAPIDocument from '../document/OpenAPIDocument.ts';
import NormalizationError from '../errors/NormalizationError.ts';
import { providerOptionsOverride as openAPIProviderOptions } from '../registry/providers/OpenAPIDocumentRegistryProvider.ts';

/**
 * Options for normalizing an OpenAPI 3.0 operation.
 * @public
 */
export type OpenAPI30OperationNormalizerOptions = PartialDeep<ApiDOMReferenceOptions>;

const normalizerOptionsOverride = mergeOptions(openAPIProviderOptions as ApiDOMReferenceOptions, {
  dereference: {
    strategies: [new OpenAPI30DereferenceStrategy()],
    immutable: false,
  },
});

/**
 * Version-specific normalization for OpenAPI 3.0 operations.
 *
 * Dereferences the operation subtree and handles merging of servers,
 * parameters, and security from path item and root levels.
 * @public
 */
class OpenAPI30OperationNormalizer {
  readonly #options: ApiDOMReferenceOptions;

  constructor(options: OpenAPI30OperationNormalizerOptions = {}) {
    this.#options = mergeOptions(normalizerOptionsOverride, options);
  }

  async normalize(
    operation: OperationElement,
    document: OpenAPIDocument,
  ): Promise<OperationElement> {
    const operationPointer = toValue(operation.meta.get('pointer')) as JSONPointer;

    if (!testJSONPointer(operationPointer)) {
      throw new NormalizationError(
        `Operation is missing valid "pointer" metadata. Was it produced by OpenAPIOperationExtractor?`,
        { operationId: toValue(operation.operationId), uri: document.uri, operationPointer },
      );
    }

    const tokens = parse(operationPointer).tree!;
    const pathItemPointer = compile(tokens.slice(0, -1));

    let pathItem: PathItemElement;
    try {
      pathItem = evaluate<PathItemElement>(document.parseResult.api, pathItemPointer);
    } catch (error: unknown) {
      throw new NormalizationError(
        `Failed to evaluate path item pointer "${pathItemPointer}" in OpenAPI 3.0 document at "${document.uri}"`,
        {
          cause: error,
          operationId: toValue(operation.operationId),
          uri: document.uri,
          operationPointer,
          pathItemPointer,
        },
      );
    }

    if (!isPathItemElement(pathItem)) {
      throw new NormalizationError(
        `Pointer "${pathItemPointer}" does not reference a path item in OpenAPI 3.0 document at "${document.uri}"`,
        {
          operationId: toValue(operation.operationId),
          uri: document.uri,
          operationPointer,
          pathItemPointer,
        },
      );
    }

    // preparing data for normalization by lazy dereferencing
    const entry = document.parseResult.api as OpenApi3_0Element;
    const operationDeref = await this.#dereferenceOperation(operation, document);

    // dereferencing Path Item Parameter Object references
    if (isArrayElement(pathItem.parameters)) {
      pathItem.parameters = await this.#dereferencePathItemParameters(pathItem, document);
    }

    // normalization (mutable)
    refractorPluginNormalizeServers.ensureDefaultServer(entry);
    refractorPluginNormalizeServers.inheritServersToPathItem(pathItem, entry);
    refractorPluginNormalizeServers.inheritServersToOperation(operationDeref, pathItem);
    refractorPluginNormalizeParameters.inheritParametersToOperation(operationDeref, pathItem);
    refractorPluginNormalizeSecurityRequirements.inheritSecurityToOperation(operationDeref, entry);

    return operationDeref;
  }

  async #dereferenceOperation(
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
        `Failed to dereference Operation "${toValue(operation.operationId)}" in OpenAPI 3.0 document at "${document.uri}"`,
        { cause: error, operationId: toValue(operation.operationId), uri: document.uri },
      );
    }
  }

  async #dereferencePathItemParameters(
    pathItem: PathItemElement,
    document: OpenAPIDocument,
  ): Promise<PathItemElement['parameters']> {
    try {
      return await dereferenceOpenAPIElement(
        pathItem.parameters,
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
        `Failed to dereference Path Item parameters in OpenAPI 3.0 document at "${document.uri}"`,
        { cause: error, uri: document.uri },
      );
    }
  }
}

export default OpenAPI30OperationNormalizer;
