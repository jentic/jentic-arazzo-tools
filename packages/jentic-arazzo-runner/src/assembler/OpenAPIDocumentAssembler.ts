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
import AssemblerError from '../errors/AssemblerError.ts';
import OpenAPI2DocumentAssembler from './OpenAPI2DocumentAssembler.ts';
import OpenAPI30DocumentAssembler from './OpenAPI30DocumentAssembler.ts';
import OpenAPI31DocumentAssembler from './OpenAPI31DocumentAssembler.ts';

/**
 * Options for the OpenAPI document assembler facade.
 * @public
 */
export interface OpenAPIDocumentAssemblerOptions {
  readonly openapi2?: OpenAPI2DocumentAssembler;
  readonly openapi30?: OpenAPI30DocumentAssembler;
  readonly openapi31?: OpenAPI31DocumentAssembler;
}

/**
 * Facade for assembling standalone OpenAPI documents across all supported versions.
 *
 * Detects the OpenAPI version from the source document and delegates to the
 * appropriate version-specific assembler (2.0, 3.0, or 3.1).
 *
 * Custom assembler instances can be provided via constructor options.
 * @public
 */
class OpenAPIDocumentAssembler {
  readonly #openapi2: OpenAPI2DocumentAssembler;
  readonly #openapi30: OpenAPI30DocumentAssembler;
  readonly #openapi31: OpenAPI31DocumentAssembler;

  constructor(options: OpenAPIDocumentAssemblerOptions = {}) {
    this.#openapi2 = options.openapi2 ?? new OpenAPI2DocumentAssembler();
    this.#openapi30 = options.openapi30 ?? new OpenAPI30DocumentAssembler();
    this.#openapi31 = options.openapi31 ?? new OpenAPI31DocumentAssembler();
  }

  /**
   * Assembles a standalone OpenAPI document by delegating to the version-specific assembler.
   */
  assemble(operation: OpenAPIOperationElement, document: OpenAPIDocument): OpenAPIDocument {
    const root = document.parseResult.api;

    if (isSwaggerElement(root)) {
      return this.#openapi2.assemble(operation as OperationElement2, document);
    }
    if (isOpenApi3_0Element(root)) {
      return this.#openapi30.assemble(operation as OperationElement30, document);
    }
    if (isOpenApi3_1Element(root)) {
      return this.#openapi31.assemble(operation as OperationElement31, document);
    }

    throw new AssemblerError(`Unsupported OpenAPI version in document at "${document.uri}"`, {
      uri: document.uri,
    });
  }
}

export default OpenAPIDocumentAssembler;
