/**
 * The HTTP request an OpenAPI operation was executed with.
 *
 * Populated by the client from the request it actually built and sent, so
 * runtime expressions (`$url`, `$method`, `$request.header.*`, `$request.body`)
 * can be evaluated against it after execution.
 * @public
 */
export interface OpenAPIOperationRequestInfo {
  readonly url?: string;
  readonly method?: string;
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
}

/**
 * Response from an OpenAPI operation execution.
 * @public
 */
class OpenAPIOperationResponse {
  readonly ok: boolean;
  readonly url: string;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly text: string;
  readonly body: unknown;
  readonly request: OpenAPIOperationRequestInfo | undefined;

  constructor(raw: {
    ok: boolean;
    url: string;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    text: string;
    body: unknown;
    request?: OpenAPIOperationRequestInfo;
  }) {
    this.ok = raw.ok;
    this.url = raw.url;
    this.status = raw.status;
    this.statusText = raw.statusText;
    this.headers = raw.headers;
    this.text = raw.text;
    this.body = raw.body;
    this.request = raw.request;
  }
}

export default OpenAPIOperationResponse;
