import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import type { OperationElement } from '@speclynx/apidom-ns-openapi-3-0';

import { DocumentRegistry, OpenAPIDocument, ClientError } from '../../src/index.ts';
import OpenAPIOperationExtractor from '../../src/extractor/OpenAPIOperationExtractor.ts';
import OpenAPI30OperationNormalizer from '../../src/normalizer/OpenAPI30OperationNormalizer.ts';
import OpenAPI30DocumentAssembler from '../../src/assembler/OpenAPI30DocumentAssembler.ts';
import OpenAPIClientSwagger from '../../src/client/OpenAPIClientSwagger.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures', 'petstore-order-workflow.arazzo.yaml');

const extractAs30 = (extractor: OpenAPIOperationExtractor, doc: OpenAPIDocument, id: string) =>
  extractor.extract(doc, id) as unknown as OperationElement;

/**
 * Creates a mock fetch that captures the request and returns a fake response.
 */
function createMockFetch() {
  let capturedUrl: string | undefined;
  let capturedRequest: Record<string, unknown> | undefined;

  const mockFetch = async (url: string, request: Record<string, unknown>) => {
    capturedUrl = url;
    capturedRequest = request;
    return new Response(JSON.stringify({ id: 1, name: 'doggie' }), {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
    });
  };

  return {
    mockFetch,
    getCapturedUrl: () => capturedUrl,
    getCapturedRequest: () => capturedRequest,
  };
}

describe('OpenAPIClientSwagger', function () {
  const extractor = new OpenAPIOperationExtractor();
  const normalizer = new OpenAPI30OperationNormalizer();
  const assembler = new OpenAPI30DocumentAssembler();
  let openapiDoc: OpenAPIDocument;

  before(async function () {
    const registry = new DocumentRegistry();
    const entryDoc = await registry.acquireEntryDocument(fixturePath);
    const sourceURI = entryDoc.resolveSourceDescriptionURI('petstoreAPI')!;
    openapiDoc = (await registry.acquire(sourceURI)) as OpenAPIDocument;
  });

  context('execute with operationId', function () {
    specify('should build correct URL for findPetsByStatus', async function () {
      const operation = extractAs30(extractor, openapiDoc, 'findPetsByStatus');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);
      const client = new OpenAPIClientSwagger(assembled);
      const { mockFetch, getCapturedUrl } = createMockFetch();

      await client.execute({
        operationId: 'findPetsByStatus',
        parameters: { status: 'available' },
        contextUrl: 'https://petstore3.swagger.io',
        userFetch: mockFetch,
      });

      assert.include(getCapturedUrl()!, 'https://petstore3.swagger.io/api/v3/pet/findByStatus');
      assert.include(getCapturedUrl()!, 'status=available');
    });

    specify('should build correct URL for getPetById', async function () {
      const operation = extractAs30(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);
      const client = new OpenAPIClientSwagger(assembled);
      const { mockFetch, getCapturedUrl } = createMockFetch();

      await client.execute({
        operationId: 'getPetById',
        parameters: { petId: 42 },
        contextUrl: 'https://petstore3.swagger.io',
        userFetch: mockFetch,
      });

      assert.include(getCapturedUrl()!, 'https://petstore3.swagger.io/api/v3/pet/42');
    });

    specify('should use correct HTTP method for placeOrder', async function () {
      const operation = extractAs30(extractor, openapiDoc, 'placeOrder');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);
      const client = new OpenAPIClientSwagger(assembled);
      const { mockFetch, getCapturedRequest } = createMockFetch();

      await client.execute({
        operationId: 'placeOrder',
        requestBody: { petId: 42, quantity: 1 },
        contextUrl: 'https://petstore3.swagger.io',
        userFetch: mockFetch,
      });

      assert.strictEqual(getCapturedRequest()!.method, 'POST');
    });

    specify('should return OpenAPIOperationResponse', async function () {
      const operation = extractAs30(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);
      const client = new OpenAPIClientSwagger(assembled);
      const { mockFetch } = createMockFetch();

      const response = await client.execute({
        operationId: 'getPetById',
        parameters: { petId: 1 },
        contextUrl: 'https://petstore3.swagger.io',
        userFetch: mockFetch,
      });

      assert.strictEqual(response.status, 200);
      assert.isTrue(response.ok);
      assert.isObject(response.body);
    });
  });

  context('execute with operationPath', function () {
    specify('should build correct URL using JSON Pointer', async function () {
      const operation = extractAs30(extractor, openapiDoc, 'findPetsByStatus');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);
      const client = new OpenAPIClientSwagger(assembled);
      const { mockFetch, getCapturedUrl } = createMockFetch();

      await client.execute({
        operationPath: '/paths/~1pet~1findByStatus/get',
        parameters: { status: 'available' },
        contextUrl: 'https://petstore3.swagger.io',
        userFetch: mockFetch,
      });

      assert.include(getCapturedUrl()!, 'https://petstore3.swagger.io/api/v3/pet/findByStatus');
    });
  });

  context('non-2xx and transport failures', function () {
    /**
     * swagger-client rejects on a non-2xx status, but the rejection carries the
     * HTTP response — a non-2xx is a valid Arazzo outcome (judged by a step's
     * successCriteria), so the client returns it rather than throwing.
     */
    specify('should return a non-2xx response instead of throwing', async function () {
      const operation = extractAs30(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);
      const client = new OpenAPIClientSwagger(assembled);

      const response = await client.execute({
        operationId: 'getPetById',
        parameters: { petId: 1 },
        contextUrl: 'https://petstore3.swagger.io',
        userFetch: async () =>
          new Response(JSON.stringify({ message: 'boom' }), {
            status: 500,
            statusText: 'Internal Server Error',
            headers: { 'content-type': 'application/json' },
          }),
      });

      assert.strictEqual(response.status, 500);
      assert.isFalse(response.ok);
      assert.deepEqual(response.body, { message: 'boom' });
    });

    /**
     * a rejection without a response is a genuine transport failure and is
     * wrapped as a ClientError carrying the original error as its cause.
     */
    specify('should throw ClientError on a transport failure', async function () {
      const operation = extractAs30(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);
      const client = new OpenAPIClientSwagger(assembled);
      const cause = new Error('network down');

      let thrown: unknown;
      try {
        await client.execute({
          operationId: 'getPetById',
          parameters: { petId: 1 },
          contextUrl: 'https://petstore3.swagger.io',
          userFetch: async () => {
            throw cause;
          },
        });
      } catch (error) {
        thrown = error;
      }

      assert.instanceOf(thrown, ClientError);
      assert.strictEqual((thrown as ClientError).cause, cause);
    });
  });

  context('captured request', function () {
    specify('should expose the sent request on the response', async function () {
      const operation = extractAs30(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);
      const client = new OpenAPIClientSwagger(assembled);
      const { mockFetch } = createMockFetch();

      const response = await client.execute({
        operationId: 'getPetById',
        parameters: { petId: 42 },
        contextUrl: 'https://petstore3.swagger.io',
        userFetch: mockFetch,
      });

      assert.isDefined(response.request);
      assert.include(response.request!.url!, 'https://petstore3.swagger.io/api/v3/pet/42');
      assert.strictEqual(response.request!.method, 'GET');
    });

    specify('should still invoke a caller-supplied requestInterceptor', async function () {
      const operation = extractAs30(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);
      const client = new OpenAPIClientSwagger(assembled);
      const { mockFetch } = createMockFetch();
      let intercepted = false;

      const response = await client.execute({
        operationId: 'getPetById',
        parameters: { petId: 42 },
        contextUrl: 'https://petstore3.swagger.io',
        requestInterceptor: (request) => {
          intercepted = true;
          return request;
        },
        userFetch: mockFetch,
      });

      assert.isTrue(intercepted);
      assert.isDefined(response.request);
      assert.strictEqual(response.request!.method, 'GET');
    });

    specify(
      'should compose with an async caller requestInterceptor and capture its edits',
      async function () {
        const operation = extractAs30(extractor, openapiDoc, 'getPetById');
        const normalized = await normalizer.normalize(operation, openapiDoc);
        const assembled = assembler.assemble(normalized, openapiDoc);
        const client = new OpenAPIClientSwagger(assembled);
        const { mockFetch } = createMockFetch();

        const response = await client.execute({
          operationId: 'getPetById',
          parameters: { petId: 42 },
          contextUrl: 'https://petstore3.swagger.io',
          // an async interceptor that adds a header — the captured request must
          // reflect the awaited result, not a pending promise.
          requestInterceptor: async (request: unknown) => {
            const req = request as Record<string, unknown>;
            const headers = (req.headers ?? {}) as Record<string, string>;
            return { ...req, headers: { ...headers, 'x-trace': 'abc' } };
          },
          userFetch: mockFetch,
        });

        assert.isDefined(response.request);
        assert.strictEqual(response.request!.headers?.['x-trace'], 'abc');
      },
    );

    specify('should capture the request even on a non-2xx response', async function () {
      const operation = extractAs30(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);
      const client = new OpenAPIClientSwagger(assembled);

      const response = await client.execute({
        operationId: 'getPetById',
        parameters: { petId: 42 },
        contextUrl: 'https://petstore3.swagger.io',
        userFetch: async () =>
          new Response('boom', { status: 500, statusText: 'Internal Server Error', headers: {} }),
      });

      assert.strictEqual(response.status, 500);
      assert.isDefined(response.request);
      assert.strictEqual(response.request!.method, 'GET');
    });
  });
});
