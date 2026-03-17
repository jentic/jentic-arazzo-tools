import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { toJSON } from '@speclynx/apidom-core';
import { isArazzoSpecification1Element } from '@speclynx/apidom-ns-arazzo-1';

import ArazzoDocumentRegistryProvider from '../../../src/registry/providers/ArazzoDocumentRegistryProvider.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(
  __dirname,
  '..',
  '..',
  'fixtures',
  'petstore-order-workflow.arazzo.yaml',
);

describe('ArazzoDocumentRegistryProvider', function () {
  context('provide', function () {
    specify('should provide an Arazzo document', async function () {
      const provider = new ArazzoDocumentRegistryProvider();
      const doc = await provider.provide(fixturePath);

      assert.isTrue(isArazzoSpecification1Element(doc.parseResult.api));
    });

    specify('should produce a serializable document', async function () {
      const provider = new ArazzoDocumentRegistryProvider();
      const doc = await provider.provide(fixturePath);
      const json = toJSON(doc.parseResult.api!);

      assert.isString(json);
    });
  });
});
