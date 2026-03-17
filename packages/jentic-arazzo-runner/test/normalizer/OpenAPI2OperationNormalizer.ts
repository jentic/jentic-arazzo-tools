import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { toValue } from '@speclynx/apidom-core';
import type { OperationElement } from '@speclynx/apidom-ns-openapi-2';

import { DocumentRegistry, OpenAPIDocument } from '../../src/index.ts';
import OpenAPIOperationExtractor from '../../src/extractor/OpenAPIOperationExtractor.ts';
import OpenAPI2OperationNormalizer from '../../src/normalizer/OpenAPI2OperationNormalizer.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(
  __dirname,
  '..',
  'fixtures',
  'petstore-order-workflow-2-0.arazzo.yaml',
);

const extractAs2 = (extractor: OpenAPIOperationExtractor, doc: OpenAPIDocument, id: string) =>
  extractor.extract(doc, id) as unknown as OperationElement;

describe('OpenAPI2OperationNormalizer', function () {
  const extractor = new OpenAPIOperationExtractor();
  const normalizer = new OpenAPI2OperationNormalizer();
  let openapiDoc: OpenAPIDocument;

  before(async function () {
    const registry = new DocumentRegistry();
    const entryDoc = await registry.acquireEntryDocument(fixturePath);
    const sourceURI = entryDoc.resolveSourceDescriptionURI('petstoreAPI')!;
    openapiDoc = (await registry.acquire(sourceURI)) as OpenAPIDocument;
  });

  context('normalize', function () {
    specify('should return an operation element', async function () {
      const operation = extractAs2(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);

      assert.strictEqual(normalized.element, 'operation');
    });

    specify('should preserve operationId', async function () {
      const operation = extractAs2(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);

      assert.strictEqual(toValue(normalized.operationId), 'getPetById');
    });

    specify('should dereference $ref in operation subtree', async function () {
      const operation = extractAs2(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const pojo = toValue(normalized) as Record<string, unknown>;

      const responses = pojo.responses as Record<string, Record<string, unknown>>;
      const okResponse = responses['200'];
      const schema = okResponse.schema as Record<string, unknown>;

      assert.isUndefined(schema.$ref);
      assert.isDefined(schema.properties);
    });

    specify('should inherit parameters from path item', async function () {
      const operation = extractAs2(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const pojo = toValue(normalized) as Record<string, unknown>;

      const parameters = pojo.parameters as Record<string, unknown>[];
      assert.isArray(parameters);
      const petIdParam = parameters.find((p) => p.name === 'petId' && p.in === 'path');
      assert.isDefined(petIdParam);
    });

    specify(
      'should not have security when operation has none and no root security',
      async function () {
        const operation = extractAs2(extractor, openapiDoc, 'placeOrder');
        const normalized = await normalizer.normalize(operation, openapiDoc);
        const pojo = toValue(normalized) as Record<string, unknown>;

        assert.isUndefined(pojo.security);
      },
    );

    specify('should keep operation-level security when defined', async function () {
      const operation = extractAs2(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const pojo = toValue(normalized) as Record<string, unknown>;

      const security = pojo.security as Record<string, unknown>[];
      assert.isArray(security);
      assert.isAbove(security.length, 0);
    });
  });
});
