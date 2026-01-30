import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { isParseResultElement } from '@speclynx/apidom-datamodel';
import { isArazzoSpecification1Element } from '@speclynx/apidom-ns-arazzo-1';
import { toValue } from '@speclynx/apidom-core';

import { dereference, DereferenceError } from '../../src/index.ts';
import { createHTTPServer, loadJsonFile, type ServerTerminable } from '../helpers.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, 'fixtures');

describe('dereference', function () {
  context('given file system path', function () {
    const rootFilePath = path.join(fixturesPath, 'root.json');

    specify('should return ParseResultElement', async function () {
      const result = await dereference(rootFilePath);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain ArazzoSpecification1Element as api', async function () {
      const result = await dereference(rootFilePath);

      assert.isTrue(isArazzoSpecification1Element(result.api));
    });

    specify('should dereference reusable objects', async function () {
      const actual = await dereference(rootFilePath);
      const expected = loadJsonFile(path.join(fixturesPath, 'dereferenced.json'));

      assert.deepEqual(toValue(actual), expected);
    });
  });

  context('given HTTP URL', function () {
    let server: ServerTerminable;

    beforeEach(async function () {
      server = await createHTTPServer({ cwd: fixturesPath });
    });

    afterEach(async function () {
      await server.terminate();
    });

    specify('should return ParseResultElement', async function () {
      const result = await dereference(`http://localhost:${server.port}/root.json`);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain ArazzoSpecification1Element as api', async function () {
      const result = await dereference(`http://localhost:${server.port}/root.json`);

      assert.isTrue(isArazzoSpecification1Element(result.api));
    });

    specify('should dereference reusable objects', async function () {
      const actual = await dereference(`http://localhost:${server.port}/root.json`);
      const expected = loadJsonFile(path.join(fixturesPath, 'dereferenced.json'));

      assert.deepEqual(toValue(actual), expected);
    });
  });

  context('given invalid URI', function () {
    specify('should throw DereferenceError', async function () {
      try {
        await dereference('/non/existent/path.json');
        assert.fail('Expected DereferenceError to be thrown');
      } catch (error) {
        assert.instanceOf(error, DereferenceError);
        assert.include((error as DereferenceError).message, '/non/existent/path.json');
      }
    });
  });
});
