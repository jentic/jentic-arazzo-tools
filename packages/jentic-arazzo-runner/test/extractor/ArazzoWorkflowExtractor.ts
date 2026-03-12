import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { toValue } from '@speclynx/apidom-core';
import { isWorkflowElement } from '@speclynx/apidom-ns-arazzo-1';

import { DocumentRegistry } from '../../src/index.ts';
import ArazzoWorkflowExtractor from '../../src/extractor/ArazzoWorkflowExtractor.ts';
import ArazzoWorkflowNotFoundError from '../../src/errors/ArazzoWorkflowNotFoundError.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures', 'petstore-order-workflow.arazzo.yaml');

describe('ArazzoWorkflowExtractor', function () {
  context('extract', function () {
    specify('should extract a workflow by workflowId', async function () {
      const registry = new DocumentRegistry();
      const entryDoc = await registry.acquireEntryDocument(fixturePath);
      const extractor = new ArazzoWorkflowExtractor();
      const workflow = extractor.extract(entryDoc, 'authenticateAndOrderPet');

      assert.isTrue(isWorkflowElement(workflow));
      assert.strictEqual(toValue(workflow.workflowId), 'authenticateAndOrderPet');
    });

    specify('should throw ArazzoWorkflowNotFoundError for unknown workflowId', async function () {
      const registry = new DocumentRegistry();
      const entryDoc = await registry.acquireEntryDocument(fixturePath);
      const extractor = new ArazzoWorkflowExtractor();

      try {
        extractor.extract(entryDoc, 'nonExistentWorkflow');
        assert.fail('Expected ArazzoWorkflowNotFoundError to be thrown');
      } catch (error) {
        assert.instanceOf(error, ArazzoWorkflowNotFoundError);
      }
    });
  });
});
