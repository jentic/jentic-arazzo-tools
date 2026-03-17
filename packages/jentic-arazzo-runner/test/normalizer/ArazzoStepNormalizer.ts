import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { toValue } from '@speclynx/apidom-core';
import type { WorkflowElement } from '@speclynx/apidom-ns-arazzo-1';

import { DocumentRegistry } from '../../src/index.ts';
import ArazzoWorkflowExtractor from '../../src/extractor/ArazzoWorkflowExtractor.ts';
import ArazzoStepExtractor from '../../src/extractor/ArazzoStepExtractor.ts';
import ArazzoStepNormalizer from '../../src/normalizer/ArazzoStepNormalizer.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures', 'petstore-order-workflow.arazzo.yaml');

describe('ArazzoStepNormalizer', function () {
  const workflowExtractor = new ArazzoWorkflowExtractor();
  const stepExtractor = new ArazzoStepExtractor();
  const normalizer = new ArazzoStepNormalizer();
  let workflow: WorkflowElement;
  let entryDoc: InstanceType<typeof import('../../src/document/ArazzoDocument.ts').default>;

  before(async function () {
    const registry = new DocumentRegistry();
    entryDoc = await registry.acquireEntryDocument(fixturePath);
    workflow = workflowExtractor.extract(entryDoc, 'authenticateAndOrderPet');
  });

  context('normalize', function () {
    specify('should return a StepElement', async function () {
      const step = stepExtractor.extract(workflow, 'loginUser');
      const normalized = await normalizer.normalize(step, entryDoc);

      assert.isTrue(normalized.element === 'step');
    });

    specify('should preserve stepId', async function () {
      const step = stepExtractor.extract(workflow, 'loginUser');
      const normalized = await normalizer.normalize(step, entryDoc);

      assert.strictEqual(toValue(normalized.stepId), 'loginUser');
    });

    specify('should return the same element (identity)', async function () {
      const step = stepExtractor.extract(workflow, 'loginUser');
      const normalized = await normalizer.normalize(step, entryDoc);

      assert.strictEqual(normalized, step);
    });
  });
});
