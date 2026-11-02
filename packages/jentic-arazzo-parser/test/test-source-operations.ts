import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';

import {
  parseArazzo,
  indexSourceOperations,
  resolveStepOperation,
  attachStepOperations,
} from '../src/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, 'fixtures', 'source-descriptions');

describe('indexSourceOperations', function () {
  specify('should index openapi source description operations by operationId', async function () {
    const parseResult = await parseArazzo(path.join(fixturesPath, 'arazzo-with-openapi.json'), {
      parse: { parserOpts: { sourceDescriptions: true } },
    });
    const index = indexSourceOperations(parseResult);

    assert.deepEqual(index.get('petStore')?.get('listPets'), { method: 'GET', path: '/pets' });
  });

  specify('should index nothing when source descriptions are not parsed', async function () {
    const parseResult = await parseArazzo(path.join(fixturesPath, 'arazzo-with-openapi.json'));

    assert.strictEqual(indexSourceOperations(parseResult).size, 0);
  });

  specify('should skip source descriptions not of type openapi', async function () {
    const parseResult = await parseArazzo(path.join(fixturesPath, 'arazzo-with-arazzo.json'), {
      parse: { parserOpts: { sourceDescriptions: true } },
    });

    assert.strictEqual(indexSourceOperations(parseResult).size, 0);
  });
});

describe('resolveStepOperation', function () {
  const sources = new Map([
    ['petStore', new Map([['listPets', { method: 'GET', path: '/pets' }]])],
  ]);

  specify('should resolve qualified and bare operationIds', function () {
    const expected = { method: 'GET', path: '/pets' };

    assert.deepEqual(
      resolveStepOperation({ operationId: '$sourceDescriptions.petStore.listPets' }, sources),
      expected,
    );
    assert.deepEqual(resolveStepOperation({ operationId: 'listPets' }, sources), expected);
  });

  specify('should resolve operationPath from its JSON pointer', function () {
    const operationPath = '{$sourceDescriptions.petStore.url}#/paths/~1pets~1{petId}/delete';

    assert.deepEqual(resolveStepOperation({ operationPath }, sources), {
      method: 'DELETE',
      path: '/pets/{petId}',
    });
  });

  specify('should return undefined for unknown operations', function () {
    assert.isUndefined(resolveStepOperation({ operationId: 'unknown' }, sources));
  });
});

describe('attachStepOperations', function () {
  specify('should set _operation on resolved steps only', function () {
    const sources = new Map([
      ['petStore', new Map([['listPets', { method: 'GET', path: '/pets' }]])],
    ]);
    const doc = {
      workflows: [{ steps: [{ operationId: 'listPets' }, { workflowId: 'other' }] }],
    };

    assert.deepEqual<unknown>(attachStepOperations(doc, sources).workflows[0].steps, [
      { operationId: 'listPets', _operation: { method: 'GET', path: '/pets' } },
      { workflowId: 'other' },
    ]);
  });
});
