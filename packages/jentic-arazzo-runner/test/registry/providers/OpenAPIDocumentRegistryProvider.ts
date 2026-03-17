import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { toJSON } from '@speclynx/apidom-core';
import { isOpenApi3_0Element } from '@speclynx/apidom-ns-openapi-3-0';

import OpenAPIDocumentRegistryProvider from '../../../src/registry/providers/OpenAPIDocumentRegistryProvider.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', '..', 'fixtures', 'petstore.openapi.json');

describe('OpenAPIDocumentRegistryProvider', function () {
  context('provide', function () {
    specify('should provide an OpenAPI document', async function () {
      const provider = new OpenAPIDocumentRegistryProvider();
      const doc = await provider.provide(fixturePath);

      assert.isTrue(isOpenApi3_0Element(doc.parseResult.api));
    });

    specify('should produce a serializable document', async function () {
      const provider = new OpenAPIDocumentRegistryProvider();
      const doc = await provider.provide(fixturePath);
      const json = toJSON(doc.parseResult.api!);

      assert.isString(json);
    });
  });
});
