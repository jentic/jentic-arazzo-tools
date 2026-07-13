import { parse, testJSONPointer } from '@speclynx/apidom-json-pointer';

// @ts-expect-error vendored swagger-client bundle has no type declarations
import { execute } from '../vendor/swagger-client.mjs';
import type OpenAPIDocument from '../document/OpenAPIDocument.ts';
import OpenAPIClient, { type OpenAPIOperationExecuteOptions } from './OpenAPIClient.ts';
import OpenAPIOperationResponse, {
  type OpenAPIOperationRequestInfo,
} from './OpenAPIOperationResponse.ts';
import ClientError from '../errors/ClientError.ts';

/**
 * Swagger-client specific options extending the base OpenAPIOperationExecuteOptions.
 * @public
 */
export interface SwaggerOpenAPIOperationExecuteOptions extends OpenAPIOperationExecuteOptions {
  readonly responseContentType?: string;
  readonly contextUrl?: string;
  readonly server?: string;
  readonly serverVariables?: Record<string, string>;
  readonly userFetch?: (url: string, request: Record<string, unknown>) => Promise<Response>;
  readonly requestInterceptor?: (request: unknown) => unknown | Promise<unknown>;
  readonly responseInterceptor?: (response: unknown) => unknown | Promise<unknown>;
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
    const { operationId, operationPath, requestInterceptor, ...rest } = options;

    // capture the request swagger-client builds (its final url, method, headers,
    // and body) so `$url` / `$method` / `$request.*` can be evaluated after
    // execution. a caller-supplied interceptor is composed first — it runs
    // before capture, so the captured request reflects its edits — and may be
    // synchronous or asynchronous (swagger-client allows either).
    let request: OpenAPIOperationRequestInfo | undefined;
    const captureInterceptor = async (built: Record<string, unknown>): Promise<unknown> => {
      const effective = ((await requestInterceptor?.(built)) ?? built) as Record<string, unknown>;
      request = {
        url: effective.url as string | undefined,
        method: effective.method as string | undefined,
        headers: effective.headers as Record<string, string> | undefined,
        body: effective.body,
      };
      return effective;
    };
    const request_ = { ...rest, requestInterceptor: captureInterceptor };
    let rawResponse: Record<string, unknown>;

    if (operationId) {
      rawResponse = await this.#execute({ spec: this.#spec, operationId, ...request_ });
    } else if (operationPath) {
      if (!testJSONPointer(operationPath)) {
        throw new ClientError(`Invalid operationPath: "${operationPath}"`, { operationPath });
      }
      const tokens = parse(operationPath).tree!;
      if (tokens.length !== 3 || tokens[0] !== 'paths') {
        throw new ClientError(
          `operationPath "${operationPath}" must be of form /paths/{path}/{method}`,
          { operationPath },
        );
      }
      const [, pathName, method] = tokens;
      rawResponse = await this.#execute({ spec: this.#spec, pathName, method, ...request_ });
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
      request,
    });
  }

  /**
   * Invokes swagger-client's `execute`, recovering a non-2xx response.
   *
   * swagger-client rejects on a non-2xx status, but the rejection carries the
   * HTTP `response`. A non-2xx is a valid outcome in Arazzo (it is judged by a
   * step's `successCriteria`), so the response is returned rather than thrown.
   * A rejection without a response is a genuine transport failure and is
   * wrapped as a {@link ClientError}.
   */
  async #execute(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      return await execute(request);
    } catch (error: unknown) {
      const response = (error as { response?: Record<string, unknown> })?.response;
      if (response !== undefined && response !== null) return response;
      throw new ClientError('OpenAPI operation request failed', { cause: error });
    }
  }
}

export default OpenAPIClientSwagger;
