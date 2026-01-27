import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { isParseResultElement } from '@speclynx/apidom-datamodel';
import { isArazzoSpecification1Element } from '@speclynx/apidom-ns-arazzo-1';

import { parse } from '../src/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, 'fixtures');

describe('parse', function () {
  context('given file system path', function () {
    const fixturePath = path.join(fixturesPath, 'arazzo.json');

    specify('should return ParseResultElement', async function () {
      const result = await parse(fixturePath);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain ArazzoSpecification1Element as api', async function () {
      const result = await parse(fixturePath);

      assert.isTrue(isArazzoSpecification1Element(result.api));
    });
  });
});
