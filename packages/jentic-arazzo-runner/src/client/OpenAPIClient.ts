import type OpenAPIDocument from '../document/OpenAPIDocument.ts';
import type OpenAPIOperationResponse from './OpenAPIOperationResponse.ts';

/**
 * Base options for executing an OpenAPI operation.
 * Either operationId or operationPath must be provided.
 * Client implementations may extend this with additional options.
 * @public
 */
export interface OpenAPIOperationExecuteOptions {
  readonly operationId?: string;
  readonly operationPath?: string;
  readonly parameters?: Record<string, unknown>;
  readonly requestBody?: unknown;
  /**
   * The media type of the request body (the Arazzo `requestBody.contentType`).
   * Client implementations map it to their own wire representation.
   */
  readonly requestContentType?: string;
  readonly signal?: AbortSignal;
}

/**
 * Base class for OpenAPI client implementations.
 *
 * Defines the minimal interface for executing OpenAPI operations.
 * Concrete implementations (swagger-client, Redocly, etc.) extend this
 * class and may accept additional client-specific options via generics.
 * @public
 */
abstract class OpenAPIClient<
  TOptions extends OpenAPIOperationExecuteOptions = OpenAPIOperationExecuteOptions,
> {
  readonly document: OpenAPIDocument;

  constructor(document: OpenAPIDocument) {
    this.document = document;
  }

  /**
   * Executes an OpenAPI operation.
   * Options must include either operationId or operationPath.
   */
  abstract execute(options: TOptions): Promise<OpenAPIOperationResponse>;
}

export default OpenAPIClient;
