import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';

import { DocumentRegistry, OpenAPIDocument } from '../../src/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures', 'petstore-order-workflow.arazzo.yaml');

describe('APIDocument', function () {
  let openapiDoc: OpenAPIDocument;

  before(async function () {
    const registry = new DocumentRegistry();
    const entryDoc = await registry.acquireEntryDocument(fixturePath);
    const sourceURI = entryDoc.resolveSourceDescriptionURI('petstoreAPI')!;
    openapiDoc = (await registry.acquire(sourceURI)) as OpenAPIDocument;
  });

  context('toJSON', function () {
    specify('should return a JSON-serializable object', function () {
      const json = openapiDoc.toJSON();

      assert.isObject(json);
      assert.strictEqual((json as Record<string, unknown>).openapi, '3.0.4');
    });

    specify('should work with JSON.stringify', function () {
      const str = JSON.stringify(openapiDoc);

      assert.isString(str);
      const parsed = JSON.parse(str);
      assert.strictEqual(parsed.openapi, '3.0.4');
    });
  });

  context('toYAML', function () {
    specify('should return a YAML string', function () {
      const yaml = openapiDoc.toYAML();

      assert.isString(yaml);
      assert.include(yaml, 'openapi:');
    });
  });
});
