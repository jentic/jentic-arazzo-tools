import { parse } from '@speclynx/apidom-json-pointer';

// @ts-expect-error vendored swagger-client bundle has no type declarations
import { execute } from '../vendor/swagger-client.mjs';
import type OpenAPIDocument from '../document/OpenAPIDocument.ts';
import OpenAPIClient, { type OpenAPIOperationExecuteOptions } from './OpenAPIClient.ts';
import OpenAPIOperationResponse from './OpenAPIOperationResponse.ts';
import ClientError from '../errors/ClientError.ts';

/**
 * Swagger-client specific options extending the base OpenAPIOperationExecuteOptions.
 * @public
 */
export interface SwaggerOpenAPIOperationExecuteOptions extends OpenAPIOperationExecuteOptions {
  readonly requestContentType?: string;
  readonly responseContentType?: string;
  readonly contextUrl?: string;
  readonly server?: string;
  readonly serverVariables?: Record<string, string>;
  readonly userFetch?: (url: string, request: Record<string, unknown>) => Promise<Response>;
  readonly requestInterceptor?: (request: unknown) => unknown;
  readonly responseInterceptor?: (response: unknown) => unknown;
}

/**
 * OpenAPI client powered by swagger-client's execute() function.
 *
 * Takes an OpenAPIDocument and executes operations against real API endpoints.
 * Handles parameter serialization, content types, security, and server URL resolution.
 *
 * See: https://github.com/swagger-api/swagger-js/blob/master/docs/usage/http-client-for-oas-operations.md
 * @public
 */
class OpenAPIClientSwagger extends OpenAPIClient<SwaggerOpenAPIOperationExecuteOptions> {
  readonly #spec: Record<string, unknown>;

  constructor(document: OpenAPIDocument) {
    super(document);
    this.#spec = document.toJSON() as Record<string, unknown>;
  }

  /**
   * Executes an OpenAPI operation.
   * Options must include either operationId or operationPath.
   */
  async execute(options: SwaggerOpenAPIOperationExecuteOptions): Promise<OpenAPIOperationResponse> {
    const { operationId, operationPath, ...rest } = options;
    let rawResponse: Record<string, unknown>;

    if (operationId) {
      rawResponse = await execute({ spec: this.#spec, operationId, ...rest });
    } else if (operationPath) {
      const [, pathName, method] = parse(operationPath).tree!;
      rawResponse = await execute({ spec: this.#spec, pathName, method, ...rest });
    } else {
      throw new ClientError('Either operationId or operationPath must be provided');
    }

    return new OpenAPIOperationResponse({
      ok: rawResponse.ok as boolean,
      url: rawResponse.url as string,
      status: rawResponse.status as number,
      statusText: rawResponse.statusText as string,
      headers: rawResponse.headers as Record<string, string>,
      text: rawResponse.text as string,
      body: rawResponse.body,
    });
  }
}

export default OpenAPIClientSwagger;
