import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import type { ParseResultElement } from '@speclynx/apidom-datamodel';

import { parseArazzo, findStepOperation, attachStepOperations } from '../src/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, 'fixtures', 'source-descriptions');

const listPets = { method: 'GET', path: '/pets' };

describe('findStepOperation', function () {
  let result: ParseResultElement;

  before(async function () {
    result = await parseArazzo(path.join(fixturesPath, 'arazzo-with-openapi.json'), {
      parse: { parserOpts: { sourceDescriptions: true } },
    });
  });

  specify('should find operations by operationId', function () {
    assert.deepEqual(findStepOperation(result, { operationId: 'listPets' }), listPets);
    assert.deepEqual(
      findStepOperation(result, { operationId: '$sourceDescriptions.petStore.listPets' }),
      listPets,
    );
  });

  specify('should find operations by operationPath', function () {
    const operationPath = '{$sourceDescriptions.petStore.url}#/paths/~1pets/get';

    assert.deepEqual(findStepOperation(result, { operationPath }), listPets);
  });

  specify(
    'should find the only operation of an operationPath pointing at a path item',
    function () {
      const operationPath = '{$sourceDescriptions.petStore.url}#/paths/~1pets';

      assert.deepEqual(findStepOperation(result, { operationPath }), listPets);
    },
  );

  specify('should return undefined for unknown operations', function () {
    assert.isUndefined(findStepOperation(result, { operationId: 'unknown' }));
    assert.isUndefined(
      findStepOperation(result, { operationId: '$sourceDescriptions.x.listPets' }),
    );
  });
});

describe('findStepOperation with literal URLs', function () {
  let result: ParseResultElement;

  before(async function () {
    result = await parseArazzo(path.join(fixturesPath, 'arazzo-with-literal-urls.json'), {
      parse: { parserOpts: { sourceDescriptions: true } },
    });
  });

  specify('should search only the source the URL targets', function () {
    assert.deepEqual(
      findStepOperation(result, { operationPath: './openapi-post.json#/paths/~1pets/post' }),
      { method: 'POST', path: '/pets' },
    );
    assert.deepEqual(
      findStepOperation(result, { operationPath: './openapi.json#/paths/~1pets/get' }),
      listPets,
    );
  });

  specify('should not find an operation of another source with the same path', function () {
    assert.isUndefined(
      findStepOperation(result, { operationPath: './openapi-post.json#/paths/~1pets/get' }),
    );
    assert.isUndefined(
      findStepOperation(result, { operationPath: './openapi.json#/paths/~1pets/post' }),
    );
  });

  specify(
    'should return undefined when the targeted source is unavailable or unknown',
    function () {
      assert.isUndefined(
        findStepOperation(result, { operationPath: './missing.json#/paths/~1pets/get' }),
      );
      assert.isUndefined(
        findStepOperation(result, { operationPath: './unknown.json#/paths/~1pets/get' }),
      );
    },
  );
});

describe('attachStepOperations', function () {
  specify('should convert to a plain object with _operation on resolved steps', async function () {
    const result = await parseArazzo(path.join(fixturesPath, 'arazzo-with-operations.json'), {
      parse: { parserOpts: { sourceDescriptions: true } },
    });
    const steps = attachStepOperations(result.api, result).workflows?.[0].steps ?? [];

    assert.deepEqual(
      steps.map((step) => (step as { _operation?: unknown })._operation),
      [listPets, listPets, listPets, undefined],
    );
  });
});
