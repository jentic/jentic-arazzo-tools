import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { toValue } from '@speclynx/apidom-core';
import { isWorkflowElement } from '@speclynx/apidom-ns-arazzo-1';

import { DocumentRegistry } from '../../src/index.ts';
import ArazzoWorkflowExtractor from '../../src/extractor/ArazzoWorkflowExtractor.ts';
import ArazzoWorkflowNormalizer from '../../src/normalizer/ArazzoWorkflowNormalizer.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures', 'petstore-order-workflow.arazzo.yaml');
const componentFixturePath = path.join(
  __dirname,
  '..',
  'fixtures',
  'arazzo-with-components',
  'workflow.arazzo.yaml',
);

describe('ArazzoWorkflowNormalizer', function () {
  context('normalize', function () {
    specify('should return a WorkflowElement', async function () {
      const registry = new DocumentRegistry();
      const entryDoc = await registry.acquireEntryDocument(fixturePath);
      const extractor = new ArazzoWorkflowExtractor();
      const normalizer = new ArazzoWorkflowNormalizer();

      const workflow = extractor.extract(entryDoc, 'authenticateAndOrderPet');
      const normalized = await normalizer.normalize(workflow, entryDoc);

      assert.isTrue(isWorkflowElement(normalized));
    });

    specify('should preserve workflowId', async function () {
      const registry = new DocumentRegistry();
      const entryDoc = await registry.acquireEntryDocument(fixturePath);
      const extractor = new ArazzoWorkflowExtractor();
      const normalizer = new ArazzoWorkflowNormalizer();

      const workflow = extractor.extract(entryDoc, 'authenticateAndOrderPet');
      const normalized = await normalizer.normalize(workflow, entryDoc);

      assert.strictEqual(toValue(normalized.workflowId), 'authenticateAndOrderPet');
    });

    specify('should dereference component references', async function () {
      const registry = new DocumentRegistry();
      const entryDoc = await registry.acquireEntryDocument(componentFixturePath);
      const extractor = new ArazzoWorkflowExtractor();
      const normalizer = new ArazzoWorkflowNormalizer();

      const workflow = extractor.extract(entryDoc, 'testWorkflow');
      const normalized = await normalizer.normalize(workflow, entryDoc);

      // after normalization, component references should be resolved
      assert.isTrue(isWorkflowElement(normalized));
      const steps = toValue(normalized.steps) as Record<string, unknown>[];
      assert.isArray(steps);
      assert.isAbove(steps.length, 0);
      // the parameter reference should be resolved to actual value
      const firstStep = steps[0];
      const parameters = firstStep.parameters as Record<string, unknown>[];
      assert.isArray(parameters);
      assert.strictEqual(parameters[0].name, 'petId');
    });
  });
});
