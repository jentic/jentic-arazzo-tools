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
});
