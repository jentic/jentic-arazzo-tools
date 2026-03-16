import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { toValue } from '@speclynx/apidom-core';
import type { OperationElement } from '@speclynx/apidom-ns-openapi-3-1';

import { DocumentRegistry, OpenAPIDocument } from '../../src/index.ts';
import OpenAPIOperationExtractor from '../../src/extractor/OpenAPIOperationExtractor.ts';
import OpenAPI31OperationNormalizer from '../../src/normalizer/OpenAPI31OperationNormalizer.ts';

const extractAs31 = (extractor: OpenAPIOperationExtractor, doc: OpenAPIDocument, id: string) =>
  extractor.extract(doc, id) as unknown as OperationElement;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(
  __dirname,
  '..',
  'fixtures',
  'petstore-order-workflow-3-1.arazzo.yaml',
);

describe('OpenAPI31OperationNormalizer', function () {
  const extractor = new OpenAPIOperationExtractor();
  const normalizer = new OpenAPI31OperationNormalizer();
  let openapiDoc: OpenAPIDocument;

  before(async function () {
    const registry = new DocumentRegistry();
    const entryDoc = await registry.acquireEntryDocument(fixturePath);
    const sourceURI = entryDoc.resolveSourceDescriptionURI('petstoreAPI')!;
    openapiDoc = (await registry.acquire(sourceURI)) as OpenAPIDocument;
  });

  context('normalize', function () {
    specify('should return an operation element', async function () {
      const operation = extractAs31(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);

      assert.strictEqual(normalized.element, 'operation');
    });

    specify('should preserve operationId', async function () {
      const operation = extractAs31(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);

      assert.strictEqual(toValue(normalized.operationId), 'getPetById');
    });

    specify('should dereference $ref in operation subtree', async function () {
      const operation = extractAs31(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const pojo = toValue(normalized) as Record<string, unknown>;

      const responses = pojo.responses as Record<string, Record<string, unknown>>;
      const okContent = responses['200'].content as Record<string, Record<string, unknown>>;
      const jsonSchema = okContent['application/json'].schema as Record<string, unknown>;

      assert.isUndefined(jsonSchema.$ref);
      assert.isDefined(jsonSchema.properties);
    });

    specify('should inherit servers from root', async function () {
      const operation = extractAs31(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const pojo = toValue(normalized) as Record<string, unknown>;

      assert.isArray(pojo.servers);
      assert.isAbove((pojo.servers as unknown[]).length, 0);
    });

    specify('should inherit parameters from path item', async function () {
      const operation = extractAs31(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const pojo = toValue(normalized) as Record<string, unknown>;

      const parameters = pojo.parameters as Record<string, unknown>[];
      assert.isArray(parameters);
      const petIdParam = parameters.find((p) => p.name === 'petId' && p.in === 'path');
      assert.isDefined(petIdParam);
    });

    specify(
      'should not have security when neither operation nor root defines it',
      async function () {
        const operation = extractAs31(extractor, openapiDoc, 'placeOrder');
        const normalized = await normalizer.normalize(operation, openapiDoc);
        const pojo = toValue(normalized) as Record<string, unknown>;

        assert.isUndefined(pojo.security);
      },
    );

    specify('should keep operation-level security when defined', async function () {
      const operation = extractAs31(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const pojo = toValue(normalized) as Record<string, unknown>;

      const security = pojo.security as Record<string, unknown>[];
      assert.isArray(security);
      assert.isAbove(security.length, 0);
    });
  });
});
