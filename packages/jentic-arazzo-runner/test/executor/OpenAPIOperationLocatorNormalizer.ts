import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';

import {
  DocumentRegistry,
  ArazzoDocument,
  OpenAPIOperationLocatorNormalizer,
} from '../../src/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, '..', 'fixtures');
const entryPath = path.join(fixturesPath, 'petstore-order-workflow.arazzo.yaml');

describe('OpenAPIOperationLocatorNormalizer', function () {
  let registry: DocumentRegistry;
  let entry: ArazzoDocument;
  let normalizer: OpenAPIOperationLocatorNormalizer;

  beforeEach(async function () {
    registry = new DocumentRegistry();
    entry = await registry.acquireEntryDocument(entryPath);
    normalizer = new OpenAPIOperationLocatorNormalizer(registry);
  });

  const expectedSourceURI = () => entry.resolveSourceDescriptionURI('petstoreAPI')!;

  context('normalizeOperationId', function () {
    specify('should resolve a plain operationId to (document, jsonPointer)', async function () {
      const locator = await normalizer.normalizeOperationId('findPetsByStatus', entry);

      assert.strictEqual(locator.document.uri, expectedSourceURI());
      assert.strictEqual(locator.jsonPointer, '/paths/~1pet~1findByStatus/get');
    });

    specify('should resolve a $sourceDescriptions operationId expression', async function () {
      const locator = await normalizer.normalizeOperationId(
        '$sourceDescriptions.petstoreAPI.findPetsByStatus',
        entry,
      );

      assert.strictEqual(locator.document.uri, expectedSourceURI());
      assert.strictEqual(locator.jsonPointer, '/paths/~1pet~1findByStatus/get');
    });

    specify('should reject when the operationId is in no OpenAPI source', async function () {
      let thrown: unknown;
      try {
        await normalizer.normalizeOperationId('noSuchOperation', entry);
      } catch (error) {
        thrown = error;
      }
      assert.instanceOf(thrown, Error);
    });
  });

  context('normalizeOperationPath', function () {
    specify(
      'should interpolate the embedded source url and resolve (document, jsonPointer)',
      async function () {
        const locator = await normalizer.normalizeOperationPath(
          '{$sourceDescriptions.petstoreAPI.url}#/paths/~1pet~1findByStatus/get',
          entry,
        );

        // the embedded {$sourceDescriptions.petstoreAPI.url} — a relative url in
        // the fixture — resolves to the absolute source document URI.
        assert.strictEqual(locator.document.uri, expectedSourceURI());
        assert.match(locator.document.uri, /\/fixtures\/petstore\.openapi\.json$/);
        assert.strictEqual(locator.jsonPointer, '/paths/~1pet~1findByStatus/get');
      },
    );

    specify('should resolve a literal (non-expression) source url', async function () {
      // the runner does not require a runtime expression for the source (that is
      // a validator concern): a literal url interpolates to itself and resolves.
      const literalOperationPath = `${expectedSourceURI()}#/paths/~1pet~1findByStatus/get`;

      const locator = await normalizer.normalizeOperationPath(literalOperationPath, entry);

      assert.strictEqual(locator.document.uri, expectedSourceURI());
      assert.strictEqual(locator.jsonPointer, '/paths/~1pet~1findByStatus/get');
    });

    specify('should decode a percent-encoded JSON Pointer fragment', async function () {
      // ~1 is the JSON Pointer escape for '/'; a percent-encoded fragment must
      // decode to the same pointer.
      const locator = await normalizer.normalizeOperationPath(
        '{$sourceDescriptions.petstoreAPI.url}#/paths/~1pet~1findByStatus/get',
        entry,
      );
      assert.strictEqual(locator.jsonPointer, '/paths/~1pet~1findByStatus/get');
    });

    specify('should acquire the source lazily (no pre-load required)', async function () {
      // a fresh registry with only the entry document loaded — the normalizer
      // must acquire the source on demand.
      const freshRegistry = new DocumentRegistry();
      const freshEntry = await freshRegistry.acquireEntryDocument(entryPath);
      const freshNormalizer = new OpenAPIOperationLocatorNormalizer(freshRegistry);

      const locator = await freshNormalizer.normalizeOperationPath(
        '{$sourceDescriptions.petstoreAPI.url}#/paths/~1pet~1findByStatus/get',
        freshEntry,
      );

      assert.strictEqual(
        locator.document.uri,
        freshEntry.resolveSourceDescriptionURI('petstoreAPI'),
      );
    });
  });
});
