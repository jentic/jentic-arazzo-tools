import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert, expect } from 'chai';
import { toJSON } from '@speclynx/apidom-core';
import { isOpenApi3_1Element, type OperationElement } from '@speclynx/apidom-ns-openapi-3-1';

import { DocumentRegistry, OpenAPIDocument } from '../../src/index.ts';
import OpenAPIOperationExtractor from '../../src/extractor/OpenAPIOperationExtractor.ts';
import OpenAPI31OperationNormalizer from '../../src/normalizer/OpenAPI31OperationNormalizer.ts';
import OpenAPI31DocumentAssembler from '../../src/assembler/OpenAPI31DocumentAssembler.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(
  __dirname,
  '..',
  'fixtures',
  'petstore-order-workflow-3-1.arazzo.yaml',
);

const extractAs31 = (extractor: OpenAPIOperationExtractor, doc: OpenAPIDocument, id: string) =>
  extractor.extract(doc, id) as unknown as OperationElement;

describe('OpenAPI31DocumentAssembler', function () {
  const extractor = new OpenAPIOperationExtractor();
  const normalizer = new OpenAPI31OperationNormalizer();
  const assembler = new OpenAPI31DocumentAssembler();
  let openapiDoc: OpenAPIDocument;

  before(async function () {
    const registry = new DocumentRegistry();
    const entryDoc = await registry.acquireEntryDocument(fixturePath);
    const sourceURI = entryDoc.resolveSourceDescriptionURI('petstoreAPI')!;
    openapiDoc = (await registry.acquire(sourceURI)) as OpenAPIDocument;
  });

  context('assemble', function () {
    specify('should return an OpenAPIDocument', async function () {
      const operation = extractAs31(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);

      assert.instanceOf(assembled, OpenAPIDocument);
      assert.isTrue(isOpenApi3_1Element(assembled.parseResult.api));
    });

    specify('should assemble getPetById operation', async function () {
      const operation = extractAs31(extractor, openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);

      expect(toJSON(assembled.parseResult.api!, undefined, 2)).to.matchSnapshot();
    });

    specify('should assemble placeOrder operation', async function () {
      const operation = extractAs31(extractor, openapiDoc, 'placeOrder');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);

      expect(toJSON(assembled.parseResult.api!, undefined, 2)).to.matchSnapshot();
    });
  });
});
