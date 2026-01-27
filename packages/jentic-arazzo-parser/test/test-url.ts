import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { isParseResultElement } from '@speclynx/apidom-datamodel';
import { isArazzoSpecification1Element } from '@speclynx/apidom-ns-arazzo-1';

import { parse } from '../src/index.ts';
import { createHTTPServer, type ServerTerminable } from './helpers.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, 'fixtures');

describe('parse', function () {
  context('given HTTP URL', function () {
    const httpPort = 8123;
    let httpServer: ServerTerminable;

    beforeEach(function () {
      httpServer = createHTTPServer({ port: httpPort, cwd: fixturesPath });
    });

    afterEach(async function () {
      await httpServer.terminate();
    });

    specify('should return ParseResultElement', async function () {
      const result = await parse(`http://localhost:${httpPort}/arazzo.json`);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain ArazzoSpecification1Element as api', async function () {
      const result = await parse(`http://localhost:${httpPort}/arazzo.json`);

      assert.isTrue(isArazzoSpecification1Element(result.api));
    });
  });
});
