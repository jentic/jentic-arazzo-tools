import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { parseArazzo, findStepOperation } from '@jentic/arazzo-parser';
import type { ParseResultElement } from '@jentic/arazzo-parser';

import { dereferenceSourceDescriptionPathItems } from '../../src/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(__dirname, 'fixtures', 'path-items', 'arazzo-with-path-item-refs.json');

describe('dereferenceSourceDescriptionPathItems', function () {
  let result: ParseResultElement;

  beforeEach(async function () {
    result = await parseArazzo(fixture, { parse: { parserOpts: { sourceDescriptions: true } } });
  });

  specify('should not find operations behind Path Item references beforehand', function () {
    assert.isUndefined(findStepOperation(result, { operationId: 'listPets' }));
    assert.isUndefined(findStepOperation(result, { operationId: 'createOwner' }));
  });

  specify('should resolve external Path Item references', async function () {
    await dereferenceSourceDescriptionPathItems(result);

    assert.deepEqual(findStepOperation(result, { operationId: 'listPets' }), {
      method: 'GET',
      path: '/pets',
    });
  });

  specify('should resolve local Path Item references', async function () {
    await dereferenceSourceDescriptionPathItems(result);

    assert.deepEqual(findStepOperation(result, { operationId: 'createOwner' }), {
      method: 'POST',
      path: '/owners',
    });
  });

  specify('should resolve operations whose unrelated nested references fail', async function () {
    await dereferenceSourceDescriptionPathItems(result);

    assert.deepEqual(findStepOperation(result, { operationId: 'listBroken' }), {
      method: 'GET',
      path: '/broken',
    });
  });

  specify('should resolve chains of Path Item references', async function () {
    await dereferenceSourceDescriptionPathItems(result);

    assert.deepEqual(
      findStepOperation(result, {
        operationPath: '{$sourceDescriptions.petStore.url}#/paths/~1chained/get',
      }),
      { method: 'GET', path: '/chained' },
    );
  });

  specify('should resolve references of reusable Path Items', async function () {
    const operationPath = '{$sourceDescriptions.petStore.url}#/components/pathItems/Pets/get';
    assert.isUndefined(findStepOperation(result, { operationPath }));

    await dereferenceSourceDescriptionPathItems(result);

    assert.deepEqual(findStepOperation(result, { operationPath }), { method: 'GET' });
  });

  specify('should not reject when a Path Item reference cannot be resolved', async function () {
    await dereferenceSourceDescriptionPathItems(result);

    assert.isUndefined(
      findStepOperation(result, {
        operationPath: '{$sourceDescriptions.petStore.url}#/paths/~1missing/get',
      }),
    );
  });

  specify('should ignore parse results without source descriptions', async function () {
    const withoutSources = await parseArazzo(fixture);

    await dereferenceSourceDescriptionPathItems(withoutSources);
  });

  describe('given source descriptions that are not a list', function () {
    let invalid: ParseResultElement;

    beforeEach(async function () {
      invalid = await parseArazzo({
        arazzo: '1.0.1',
        info: { title: 'Invalid', version: '1.0.0' },
        sourceDescriptions: 'not a list',
        workflows: [],
      });
    });

    specify('should reject by default', async function () {
      let rejected = false;
      try {
        await dereferenceSourceDescriptionPathItems(invalid);
      } catch {
        rejected = true;
      }
      assert.isTrue(rejected);
    });

    specify('should resolve with skipInvalid', async function () {
      await dereferenceSourceDescriptionPathItems(invalid, { skipInvalid: true });
    });
  });
});
