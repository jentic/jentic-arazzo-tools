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

  constructor(raw: {
    ok: boolean;
    url: string;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    text: string;
    body: unknown;
  }) {
    this.ok = raw.ok;
    this.url = raw.url;
    this.status = raw.status;
    this.statusText = raw.statusText;
    this.headers = raw.headers;
    this.text = raw.text;
    this.body = raw.body;
  }
}

export default OpenAPIOperationResponse;
