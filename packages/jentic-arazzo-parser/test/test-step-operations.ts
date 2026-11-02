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

  specify('should return undefined for unknown operations', function () {
    assert.isUndefined(findStepOperation(result, { operationId: 'unknown' }));
    assert.isUndefined(
      findStepOperation(result, { operationId: '$sourceDescriptions.x.listPets' }),
    );
  });
});

describe('attachStepOperations', function () {
  specify('should convert to a plain object with _operation on resolved steps', async function () {
    const result = await parseArazzo(path.join(fixturesPath, 'arazzo-with-operations.json'), {
      parse: { parserOpts: { sourceDescriptions: true } },
    });
    const steps = attachStepOperations(result.api, result).workflows?.[0].steps ?? [];

    assert.deepEqual(
      steps.map((step) => (step as { _operation?: unknown })._operation),
      [listPets, listPets, undefined],
    );
  });
});
