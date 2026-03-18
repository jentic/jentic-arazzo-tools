import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert, expect } from 'chai';
import { toJSON } from '@speclynx/apidom-core';
import { isSwaggerElement, type OperationElement } from '@speclynx/apidom-ns-openapi-2';

import { DocumentRegistry, OpenAPIDocument } from '../../src/index.ts';
import OpenAPIOperationExtractor from '../../src/extractor/OpenAPIOperationExtractor.ts';
import OpenAPI2OperationNormalizer from '../../src/normalizer/OpenAPI2OperationNormalizer.ts';
import OpenAPI2DocumentAssembler from '../../src/assembler/OpenAPI2DocumentAssembler.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(
  __dirname,
  '..',
  'fixtures',
  'petstore-order-workflow-2-0.arazzo.yaml',
);

const extractAs2 = (extractor: OpenAPIOperationExtractor, doc: OpenAPIDocument, id: string) =>
  extractor.extract(doc, id) as unknown as OperationElement;

describe('OpenAPI2DocumentAssembler', function () {
  const extractor = new OpenAPIOperationExtractor();
  const normalizer = new OpenAPI2OperationNormalizer();
  const assembler = new OpenAPI2DocumentAssembler();
  let openapiDoc: OpenAPIDocument;

  before(async function () {
    const registry = new DocumentRegistry();
    const entryDoc = await registry.acquireEntryDocument(fixturePath);
    const sourceURI = entryDoc.resolveSourceDescriptionURI('petstoreAPI')!;
    openapiDoc = (await registry.acquire(sourceURI)) as OpenAPIDocument;
  });

  context('assemble', function () {
    specify('should return a SwaggerElement', async function () {
      const operation = extractAs2(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);

      assert.isTrue(isSwaggerElement(assembled));
    });

    specify('should assemble getPetById operation', async function () {
      const operation = extractAs2(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);

      expect(toJSON(assembled, undefined, 2)).to.matchSnapshot();
    });

    specify('should assemble placeOrder operation', async function () {
      const operation = extractAs2(extractor, openapiDoc, 'placeOrder');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);

      expect(toJSON(assembled, undefined, 2)).to.matchSnapshot();
    });
  });
});
