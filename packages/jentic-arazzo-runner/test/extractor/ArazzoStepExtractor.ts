import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { toValue } from '@speclynx/apidom-core';
import type { WorkflowElement } from '@speclynx/apidom-ns-arazzo-1';

import { DocumentRegistry } from '../../src/index.ts';
import ArazzoWorkflowExtractor from '../../src/extractor/ArazzoWorkflowExtractor.ts';
import ArazzoStepExtractor from '../../src/extractor/ArazzoStepExtractor.ts';
import ExtractionError from '../../src/errors/ExtractionError.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures', 'petstore-order-workflow.arazzo.yaml');

describe('ArazzoStepExtractor', function () {
  const workflowExtractor = new ArazzoWorkflowExtractor();
  const stepExtractor = new ArazzoStepExtractor();
  let workflow: WorkflowElement;

  before(async function () {
    const registry = new DocumentRegistry();
    const entryDoc = await registry.acquireEntryDocument(fixturePath);
    workflow = workflowExtractor.extract(entryDoc, 'authenticateAndOrderPet');
  });

  context('extract', function () {
    specify('should extract a step by stepId', function () {
      const step = stepExtractor.extract(workflow, 'loginUser');

      assert.strictEqual(step.element, 'step');
    });

    specify('should extract correct stepId', function () {
      const step = stepExtractor.extract(workflow, 'loginUser');

      assert.strictEqual(toValue(step.stepId), 'loginUser');
    });

    specify('should attach workflowId metadata', function () {
      const step = stepExtractor.extract(workflow, 'loginUser');

      assert.strictEqual(toValue(step.meta.get('workflowId')), 'authenticateAndOrderPet');
    });

    specify('should extract different steps', function () {
      const step = stepExtractor.extract(workflow, 'placeOrder');

      assert.strictEqual(toValue(step.stepId), 'placeOrder');
    });

    specify('should throw ExtractionError for unknown stepId', function () {
      try {
        stepExtractor.extract(workflow, 'nonExistentStep');
        assert.fail('Expected ExtractionError to be thrown');
      } catch (error) {
        assert.instanceOf(error, ExtractionError);
      }
    });

    specify('should include workflowId in error', function () {
      try {
        stepExtractor.extract(workflow, 'nonExistentStep');
        assert.fail('Expected ExtractionError to be thrown');
      } catch (error) {
        assert.instanceOf(error, ExtractionError);
        assert.strictEqual((error as ExtractionError).workflowId, 'authenticateAndOrderPet');
      }
    });
  });
});
