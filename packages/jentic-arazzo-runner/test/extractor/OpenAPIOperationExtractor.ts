import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { toValue } from '@speclynx/apidom-core';

import { DocumentRegistry, OpenAPIDocument } from '../../src/index.ts';
import OpenAPIOperationExtractor from '../../src/extractor/OpenAPIOperationExtractor.ts';
import ExtractionError from '../../src/errors/ExtractionError.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures', 'petstore-order-workflow.arazzo.yaml');

describe('OpenAPIOperationExtractor', function () {
  let openapiDoc: OpenAPIDocument;

  before(async function () {
    const registry = new DocumentRegistry();
    const entryDoc = await registry.acquireEntryDocument(fixturePath);
    const sourceURI = entryDoc.resolveSourceDescriptionURI('petstoreAPI')!;
    openapiDoc = (await registry.acquire(sourceURI)) as OpenAPIDocument;
  });

  context('extract', function () {
    specify('should extract an operation by operationId', function () {
      const extractor = new OpenAPIOperationExtractor();
      const operation = extractor.extract(openapiDoc, 'getPetById');

      assert.strictEqual(operation.element, 'operation');
    });

    specify('should attach pointer metadata', function () {
      const extractor = new OpenAPIOperationExtractor();
      const operation = extractor.extract(openapiDoc, 'getPetById');

      assert.strictEqual(toValue(operation.meta.get('pointer')), '/paths/~1pet~1{petId}/get');
    });

    specify('should attach http-method metadata', function () {
      const extractor = new OpenAPIOperationExtractor();
      const operation = extractor.extract(openapiDoc, 'getPetById');

      assert.strictEqual(toValue(operation.meta.get('http-method')), 'get');
    });

    specify('should attach path metadata', function () {
      const extractor = new OpenAPIOperationExtractor();
      const operation = extractor.extract(openapiDoc, 'getPetById');

      assert.strictEqual(toValue(operation.meta.get('path')), '/pet/{petId}');
    });

    specify('should extract correct operationId', function () {
      const extractor = new OpenAPIOperationExtractor();
      const operation = extractor.extract(openapiDoc, 'getPetById');

      assert.strictEqual(toValue(operation.operationId), 'getPetById');
    });

    specify('should throw ExtractionError for unknown operationId', function () {
      const extractor = new OpenAPIOperationExtractor();

      try {
        extractor.extract(openapiDoc, 'nonExistent');
        assert.fail('Expected ExtractionError to be thrown');
      } catch (error) {
        assert.instanceOf(error, ExtractionError);
        assert.strictEqual((error as ExtractionError).operationId, 'nonExistent');
        assert.strictEqual((error as ExtractionError).uri, openapiDoc.uri);
      }
    });
  });

  context('extractByPointer', function () {
    specify('should extract an operation by JSON Pointer', function () {
      const extractor = new OpenAPIOperationExtractor();
      const operation = extractor.extractByPointer(openapiDoc, '/paths/~1pet~1{petId}/get');

      assert.strictEqual(operation.element, 'operation');
      assert.strictEqual(toValue(operation.operationId), 'getPetById');
    });

    specify('should throw for invalid pointer structure', function () {
      const extractor = new OpenAPIOperationExtractor();

      try {
        extractor.extractByPointer(openapiDoc, '/components/schemas/Pet');
        assert.fail('Expected ExtractionError to be thrown');
      } catch (error) {
        assert.instanceOf(error, ExtractionError);
        assert.strictEqual((error as ExtractionError).pointer, '/components/schemas/Pet');
        assert.strictEqual((error as ExtractionError).uri, openapiDoc.uri);
      }
    });

    specify('should throw for pointer not referencing an operation', function () {
      const extractor = new OpenAPIOperationExtractor();

      try {
        extractor.extractByPointer(openapiDoc, '/paths/~1pet/parameters');
        assert.fail('Expected ExtractionError to be thrown');
      } catch (error) {
        assert.instanceOf(error, ExtractionError);
      }
    });
  });
});
