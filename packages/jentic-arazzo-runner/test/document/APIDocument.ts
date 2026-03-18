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

  context('toValue', function () {
    specify('should return a plain JavaScript object', function () {
      const value = openapiDoc.toValue();

      assert.isObject(value);
      assert.strictEqual((value as Record<string, unknown>).openapi, '3.0.4');
    });
  });

  context('toJSON', function () {
    specify('should return a JSON string', function () {
      const json = openapiDoc.toJSON();

      assert.isString(json);
      assert.doesNotThrow(() => JSON.parse(json));
    });

    specify('should support pretty printing', function () {
      const json = openapiDoc.toJSON(undefined, 2);

      assert.include(json, '\n');
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
