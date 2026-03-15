import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { toValue } from '@speclynx/apidom-core';
import { isWorkflowElement } from '@speclynx/apidom-ns-arazzo-1';

import { DocumentRegistry, ArazzoDocument } from '../../src/index.ts';
import ArazzoWorkflowExtractor from '../../src/extractor/ArazzoWorkflowExtractor.ts';
import ExtractionError from '../../src/errors/ExtractionError.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures', 'petstore-order-workflow.arazzo.yaml');

describe('ArazzoWorkflowExtractor', function () {
  let entryDoc: ArazzoDocument;

  before(async function () {
    const registry = new DocumentRegistry();
    entryDoc = await registry.acquireEntryDocument(fixturePath);
  });

  context('extract', function () {
    specify('should extract a workflow by workflowId', function () {
      const extractor = new ArazzoWorkflowExtractor();
      const workflow = extractor.extract(entryDoc, 'authenticateAndOrderPet');

      assert.isTrue(isWorkflowElement(workflow));
    });

    specify('should extract correct workflowId', function () {
      const extractor = new ArazzoWorkflowExtractor();
      const workflow = extractor.extract(entryDoc, 'authenticateAndOrderPet');

      assert.strictEqual(toValue(workflow.workflowId), 'authenticateAndOrderPet');
    });

    specify('should throw ExtractionError for unknown workflowId', function () {
      const extractor = new ArazzoWorkflowExtractor();

      try {
        extractor.extract(entryDoc, 'nonExistentWorkflow');
        assert.fail('Expected ExtractionError to be thrown');
      } catch (error) {
        assert.instanceOf(error, ExtractionError);
      }
    });

    specify('should include workflowId in error', function () {
      const extractor = new ArazzoWorkflowExtractor();

      try {
        extractor.extract(entryDoc, 'nonExistentWorkflow');
        assert.fail('Expected ExtractionError to be thrown');
      } catch (error) {
        assert.instanceOf(error, ExtractionError);
        assert.strictEqual((error as ExtractionError).workflowId, 'nonExistentWorkflow');
      }
    });

    specify('should include uri in error', function () {
      const extractor = new ArazzoWorkflowExtractor();

      try {
        extractor.extract(entryDoc, 'nonExistentWorkflow');
        assert.fail('Expected ExtractionError to be thrown');
      } catch (error) {
        assert.instanceOf(error, ExtractionError);
        assert.strictEqual((error as ExtractionError).uri, entryDoc.uri);
      }
    });
  });
});
