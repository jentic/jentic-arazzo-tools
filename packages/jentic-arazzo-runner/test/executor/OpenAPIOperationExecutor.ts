import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';

import {
  DocumentRegistry,
  ArazzoDocument,
  OpenAPIOperationExecutor,
  OpenAPIOperationExtractor,
  OpenAPIOperationNormalizer,
  OpenAPIDocumentAssembler,
  OpenAPIOperationLocatorNormalizer,
  OpenAPIClient,
  OpenAPIDocument,
  OpenAPIOperationResponse,
  ExtractionError,
  type OpenAPIOperationExecuteOptions,
  type OpenAPIOperationLocator,
} from '../../src/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, '..', 'fixtures');
const entryPath = path.join(fixturesPath, 'petstore-order-workflow.arazzo.yaml');

/**
 * A stub client that records the execute options and the assembled document it
 * receives, and returns a canned response — deterministic, no network.
 */
class StubClient extends OpenAPIClient {
  readonly calls: OpenAPIOperationExecuteOptions[] = [];

  constructor(
    document: ConstructorParameters<typeof OpenAPIClient>[0],
    readonly canned: ConstructorParameters<typeof OpenAPIOperationResponse>[0],
  ) {
    super(document);
  }

  async execute(options: OpenAPIOperationExecuteOptions): Promise<OpenAPIOperationResponse> {
    this.calls.push(options);
    return new OpenAPIOperationResponse(this.canned);
  }
}

type CannedResponse = ConstructorParameters<typeof OpenAPIOperationResponse>[0];

const okResponse: CannedResponse = {
  ok: true,
  url: 'x',
  status: 200,
  statusText: 'OK',
  headers: {},
  text: '',
  body: [{ id: 7 }],
};

/**
 * Asserts a promise rejects with the given error type — a local stand-in for
 * chai-as-promised, which the package does not depend on.
 */
const rejects = async (
  promise: Promise<unknown>,
  errorType?: typeof ExtractionError,
): Promise<void> => {
  try {
    await promise;
  } catch (error) {
    if (errorType !== undefined) assert.instanceOf(error, errorType);
    return;
  }
  assert.fail('expected promise to reject, but it resolved');
};

describe('OpenAPIOperationExecutor', function () {
  let registry: DocumentRegistry;
  let entry: ArazzoDocument;
  let locator: OpenAPIOperationLocator;

  before(async function () {
    registry = new DocumentRegistry();
    entry = await registry.acquireEntryDocument(entryPath);
    // resolve a real locator the same way the step executor does.
    locator = await new OpenAPIOperationLocatorNormalizer(registry).normalizeOperationId(
      'findPetsByStatus',
      entry,
    );
  });

  const makeExecutor = (): { executor: OpenAPIOperationExecutor; clients: StubClient[] } => {
    const clients: StubClient[] = [];
    const executor = new OpenAPIOperationExecutor({
      clientFactory: (document) => {
        const client = new StubClient(document, okResponse);
        clients.push(client);
        return client;
      },
    });
    return { executor, clients };
  };

  specify('should execute the located operation and return its response', async function () {
    const { executor, clients } = makeExecutor();

    const response = await executor.execute(locator);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(clients.length, 1);
  });

  specify('should build the client from an assembled standalone document', async function () {
    const { executor, clients } = makeExecutor();

    await executor.execute(locator);

    // the client is built from the assembled doc, not the whole source doc: it
    // is an OpenAPIDocument containing just the located operation.
    const assembled = clients[0].document;
    assert.instanceOf(assembled, OpenAPIDocument);
    const paths = (assembled.toJSON() as { paths?: Record<string, unknown> }).paths ?? {};
    assert.deepEqual(Object.keys(paths), ['/pet/findByStatus']);
  });

  specify('should force the operation target as the locator JSON Pointer', async function () {
    const { executor, clients } = makeExecutor();

    await executor.execute(locator);

    // the locator's JSON Pointer selects the operation in the assembled doc.
    assert.strictEqual(clients[0].calls[0].operationPath, locator.jsonPointer);
    assert.strictEqual(clients[0].calls[0].operationPath, '/paths/~1pet~1findByStatus/get');
    assert.isUndefined(clients[0].calls[0].operationId);
  });

  specify(
    'should pass through execute options with the operation target taking precedence',
    async function () {
      const { executor, clients } = makeExecutor();

      await executor.execute(locator, {
        parameters: { status: 'available' },
        contextUrl: 'https://example.com',
        operationId: 'HIJACK',
        operationPath: '/paths/~1hijacked/get',
      });

      const call = clients[0].calls[0] as OpenAPIOperationExecuteOptions & { contextUrl?: string };
      // the opaque option passes through untouched.
      assert.deepEqual(call.parameters, { status: 'available' });
      assert.strictEqual(call.contextUrl, 'https://example.com');
      // the operation target wins: the operationPath passthrough is overridden
      // and the operationId passthrough is cleared, so executeOptions cannot
      // hijack the operation.
      assert.strictEqual(call.operationPath, '/paths/~1pet~1findByStatus/get');
      assert.isUndefined(call.operationId);
    },
  );

  specify('should forward an opaque request body and content type untouched', async function () {
    const { executor, clients } = makeExecutor();

    await executor.execute(locator, {
      requestBody: { petId: 42, quantity: 1 },
      requestContentType: 'application/json',
    });

    const call = clients[0].calls[0];
    assert.deepEqual(call.requestBody, { petId: 42, quantity: 1 });
    assert.strictEqual(call.requestContentType, 'application/json');
  });

  specify('should propagate a synchronous extraction failure', async function () {
    const { executor, clients } = makeExecutor();

    // a locator pointing at no operation: extraction fails before any client is
    // built, and the error surfaces from execute.
    await rejects(
      executor.execute({ document: locator.document, jsonPointer: '/paths/~1nope/get' }),
      ExtractionError,
    );
    assert.strictEqual(clients.length, 0);
  });

  specify('should propagate an asynchronous normalization failure', async function () {
    const clients: StubClient[] = [];
    const operationNormalizer = new OpenAPIOperationNormalizer();
    // the sole awaited step in the pipeline: a rejection here must surface from
    // execute, and no client should be built.
    operationNormalizer.normalize = async () => {
      throw new Error('normalize failed');
    };
    const executor = new OpenAPIOperationExecutor({
      operationNormalizer,
      clientFactory: (document) => {
        const client = new StubClient(document, okResponse);
        clients.push(client);
        return client;
      },
    });

    await rejects(executor.execute(locator));
    assert.strictEqual(clients.length, 0);
  });

  specify(
    'should run the injected collaborators in extract → normalize → assemble order',
    async function () {
      const order: string[] = [];
      const clients: StubClient[] = [];

      const operationExtractor = new OpenAPIOperationExtractor();
      const originalExtract = operationExtractor.extractByPointer.bind(operationExtractor);
      operationExtractor.extractByPointer = (document, pointer) => {
        order.push('extract');
        return originalExtract(document, pointer);
      };

      const operationNormalizer = new OpenAPIOperationNormalizer();
      const originalNormalize = operationNormalizer.normalize.bind(operationNormalizer);
      operationNormalizer.normalize = async (operation, document) => {
        order.push('normalize');
        return originalNormalize(operation, document);
      };

      const documentAssembler = new OpenAPIDocumentAssembler();
      const originalAssemble = documentAssembler.assemble.bind(documentAssembler);
      documentAssembler.assemble = (operation, document) => {
        order.push('assemble');
        return originalAssemble(operation, document);
      };

      const executor = new OpenAPIOperationExecutor({
        operationExtractor,
        operationNormalizer,
        documentAssembler,
        clientFactory: (document) => {
          order.push('client');
          const client = new StubClient(document, okResponse);
          clients.push(client);
          return client;
        },
      });

      await executor.execute(locator);

      assert.deepEqual(order, ['extract', 'normalize', 'assemble', 'client']);
      assert.strictEqual(clients[0].calls.length, 1);
    },
  );
});
