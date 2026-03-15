import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { toValue } from '@speclynx/apidom-core';

import { DocumentRegistry, OpenAPIDocument } from '../../src/index.ts';
import OpenAPIOperationExtractor from '../../src/extractor/OpenAPIOperationExtractor.ts';
import OpenAPIOperationNormalizer from '../../src/normalizer/OpenAPIOperationNormalizer.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures', 'petstore-order-workflow.arazzo.yaml');

describe('OpenAPIOperationNormalizer', function () {
  const extractor = new OpenAPIOperationExtractor();
  const normalizer = new OpenAPIOperationNormalizer();
  let openapiDoc: OpenAPIDocument;

  before(async function () {
    const registry = new DocumentRegistry();
    const entryDoc = await registry.acquireEntryDocument(fixturePath);
    const sourceURI = entryDoc.resolveSourceDescriptionURI('petstoreAPI')!;
    openapiDoc = (await registry.acquire(sourceURI)) as OpenAPIDocument;
  });

  context('normalize', function () {
    specify('should return an operation element', async function () {
      const operation = extractor.extract(openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);

      assert.strictEqual(normalized.element, 'operation');
    });

    specify('should preserve operationId', async function () {
      const operation = extractor.extract(openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);

      assert.strictEqual(toValue(normalized.operationId), 'getPetById');
    });

    specify('should dereference $ref in operation subtree', async function () {
      const operation = extractor.extract(openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const pojo = toValue(normalized) as Record<string, unknown>;

      // responses.200.content should have a resolved schema (not a $ref)
      const responses = pojo.responses as Record<string, Record<string, unknown>>;
      const okContent = responses['200'].content as Record<string, Record<string, unknown>>;
      const jsonSchema = okContent['application/json'].schema as Record<string, unknown>;

      assert.isUndefined(jsonSchema.$ref);
      assert.isDefined(jsonSchema.properties);
    });
  });
});
