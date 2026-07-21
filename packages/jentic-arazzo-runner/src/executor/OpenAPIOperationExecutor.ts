import type OpenAPIClient from '../client/OpenAPIClient.ts';
import type { OpenAPIOperationExecuteOptions } from '../client/OpenAPIClient.ts';
import type OpenAPIDocument from '../document/OpenAPIDocument.ts';
import type OpenAPIOperationResponse from '../client/OpenAPIOperationResponse.ts';
import OpenAPIOperationExtractor from '../extractor/OpenAPIOperationExtractor.ts';
import OpenAPIOperationNormalizer from '../normalizer/OpenAPIOperationNormalizer.ts';
import OpenAPIDocumentAssembler from '../assembler/OpenAPIDocumentAssembler.ts';
import type { OpenAPIOperationLocator } from './OpenAPIOperationLocatorNormalizer.ts';

/**
 * Builds the OpenAPI client for an assembled operation document.
 * @public
 */
export type OpenAPIClientFactory = (document: OpenAPIDocument) => OpenAPIClient;

/**
 * The client execute options forwarded to {@link OpenAPIOperationExecutor.execute}.
 *
 * The base {@link OpenAPIOperationExecuteOptions} fields (`parameters`,
 * `requestBody`, `requestContentType`, `signal`, …) are surfaced for
 * type-checked callers, while the open `Record` tail keeps the bag opaque so a
 * concrete client's extra options (e.g. a swagger client's `contextUrl`) pass
 * through untouched. The operation target (`operationId` / `operationPath`) is
 * always overridden by the executor, so setting it here has no effect.
 * @public
 */
export type OpenAPIOperationExecuteOptionsBag = Partial<OpenAPIOperationExecuteOptions> &
  Record<string, unknown>;

/**
 * Options for the OpenAPIOperationExecutor.
 * @public
 */
export interface OpenAPIOperationExecutorOptions {
  /**
   * Builds the client that executes the assembled operation.
   */
  readonly clientFactory: OpenAPIClientFactory;
  /**
   * Extracts the operation element from its owning document. Defaults to a
   * fresh {@link OpenAPIOperationExtractor}.
   */
  readonly operationExtractor?: OpenAPIOperationExtractor;
  /**
   * Normalizes the extracted operation (servers, parameters, securities).
   * Defaults to a fresh {@link OpenAPIOperationNormalizer}.
   */
  readonly operationNormalizer?: OpenAPIOperationNormalizer;
  /**
   * Assembles the standalone OpenAPI document for the operation. Defaults to a
   * fresh {@link OpenAPIDocumentAssembler}.
   */
  readonly documentAssembler?: OpenAPIDocumentAssembler;
}

/**
 * Executes a single OpenAPI operation named by a canonical
 * {@link OpenAPIOperationLocator}.
 *
 * The pipeline extracts the operation from its owning document, normalizes it,
 * assembles a minimal standalone OpenAPI document containing just that
 * operation, builds a client for the assembled document, and executes it. It
 * forms the interface between the Arazzo runner and the various OpenAPI client
 * implementations.
 *
 * The executor is Arazzo-agnostic: it neither locates the operation (that is the
 * operation locator normalizer's concern) nor resolves parameters or request
 * bodies from runtime expressions (the step executor's concern). It receives an
 * already-resolved locator and an opaque bag of client execute options, and
 * returns the raw operation response.
 * @public
 */
class OpenAPIOperationExecutor {
  readonly #clientFactory: OpenAPIClientFactory;
  readonly #operationExtractor: OpenAPIOperationExtractor;
  readonly #operationNormalizer: OpenAPIOperationNormalizer;
  readonly #documentAssembler: OpenAPIDocumentAssembler;

  constructor(options: OpenAPIOperationExecutorOptions) {
    this.#clientFactory = options.clientFactory;
    this.#operationExtractor = options.operationExtractor ?? new OpenAPIOperationExtractor();
    this.#operationNormalizer = options.operationNormalizer ?? new OpenAPIOperationNormalizer();
    this.#documentAssembler = options.documentAssembler ?? new OpenAPIDocumentAssembler();
  }

  /**
   * Executes the located operation, returning the raw operation response.
   *
   * `executeOptions` is an opaque bag of client execute options (e.g. resolved
   * `parameters`, a `requestBody` and its `requestContentType`, or a swagger
   * client's `contextUrl`). The operation target always takes precedence over
   * it: the locator's JSON Pointer selects the operation in the assembled
   * document (the assembler preserves its path/method) and is passed as
   * `operationPath`, while `operationId` is cleared so an `executeOptions`
   * passthrough cannot hijack the operation.
   */
  async execute(
    locator: OpenAPIOperationLocator,
    executeOptions: OpenAPIOperationExecuteOptionsBag = {},
  ): Promise<OpenAPIOperationResponse> {
    const operation = this.#operationExtractor.extractByPointer(
      locator.document,
      locator.jsonPointer,
    );
    const normalizedOperation = await this.#operationNormalizer.normalize(
      operation,
      locator.document,
    );
    const assembled = this.#documentAssembler.assemble(normalizedOperation, locator.document);
    const client = this.#clientFactory(assembled);

    return client.execute({
      ...executeOptions,
      operationId: undefined,
      operationPath: locator.jsonPointer,
    });
  }
}

export default OpenAPIOperationExecutor;
