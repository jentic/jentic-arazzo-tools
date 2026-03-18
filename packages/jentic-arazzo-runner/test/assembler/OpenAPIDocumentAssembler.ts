import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { isOpenApi3_0Element } from '@speclynx/apidom-ns-openapi-3-0';

import { DocumentRegistry, OpenAPIDocument } from '../../src/index.ts';
import OpenAPIOperationExtractor from '../../src/extractor/OpenAPIOperationExtractor.ts';
import OpenAPIOperationNormalizer from '../../src/normalizer/OpenAPIOperationNormalizer.ts';
import OpenAPIDocumentAssembler from '../../src/assembler/OpenAPIDocumentAssembler.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures', 'petstore-order-workflow.arazzo.yaml');

describe('OpenAPIDocumentAssembler', function () {
  const extractor = new OpenAPIOperationExtractor();
  const normalizer = new OpenAPIOperationNormalizer();
  const assembler = new OpenAPIDocumentAssembler();
  let openapiDoc: OpenAPIDocument;

  before(async function () {
    const registry = new DocumentRegistry();
    const entryDoc = await registry.acquireEntryDocument(fixturePath);
    const sourceURI = entryDoc.resolveSourceDescriptionURI('petstoreAPI')!;
    openapiDoc = (await registry.acquire(sourceURI)) as OpenAPIDocument;
  });

  context('assemble', function () {
    specify('should delegate to version-specific assembler', async function () {
      const operation = extractor.extract(openapiDoc, 'getPetById');
      const normalized = await normalizer.normalize(operation, openapiDoc);
      const assembled = assembler.assemble(normalized, openapiDoc);

      assert.instanceOf(assembled, OpenAPIDocument);
      assert.isTrue(isOpenApi3_0Element(assembled.parseResult.api));
    });
  });
});
