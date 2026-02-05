import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { isParseResultElement } from '@speclynx/apidom-datamodel';
import { isOpenApi3_1Element } from '@speclynx/apidom-ns-openapi-3-1';
import { toValue } from '@speclynx/apidom-core';
import { parseOpenAPI } from '@jentic/arazzo-parser';

import {
  dereferenceOpenAPI,
  dereferenceOpenAPIElement,
  DereferenceError,
} from '../../src/index.ts';
import { loadJsonFile } from '../helpers.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('dereferenceOpenAPI', function () {
  const fixturesPath = path.join(__dirname, 'fixtures', 'dereference-openapi');

  context('given file system path to JSON file', function () {
    const rootFilePath = path.join(fixturesPath, 'root.json');

    specify('should return ParseResultElement', async function () {
      const result = await dereferenceOpenAPI(rootFilePath);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain OpenApi3_1Element as api', async function () {
      const result = await dereferenceOpenAPI(rootFilePath);

      assert.isTrue(isOpenApi3_1Element(result.api));
    });

    specify('should dereference $ref references', async function () {
      const actual = await dereferenceOpenAPI(rootFilePath);
      const expected = loadJsonFile(path.join(fixturesPath, 'dereferenced.json'));

      assert.deepEqual(toValue(actual.api), expected);
    });

    specify('should set retrievalURI metadata', async function () {
      const result = await dereferenceOpenAPI(rootFilePath);

      assert.isTrue(result.hasMetaProperty('retrievalURI'));
      assert.strictEqual(toValue(result.meta.get('retrievalURI')), rootFilePath);
    });
  });

  context('given invalid URI', function () {
    specify('should throw DereferenceError', async function () {
      try {
        await dereferenceOpenAPI('/non/existent/path.json');
        assert.fail('Expected DereferenceError to be thrown');
      } catch (error) {
        assert.instanceOf(error, DereferenceError);
        assert.include((error as DereferenceError).message, '/non/existent/path.json');
      }
    });
  });
});

describe('dereferenceOpenAPIElement', function () {
  const fixturesPath = path.join(__dirname, 'fixtures', 'dereference-openapi');

  context('given ParseResultElement with retrievalURI metadata', function () {
    const rootFilePath = path.join(fixturesPath, 'root.json');

    specify('should return ParseResultElement', async function () {
      const parseResult = await parseOpenAPI(rootFilePath);
      const result = await dereferenceOpenAPIElement(parseResult);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain OpenApi3_1Element as api', async function () {
      const parseResult = await parseOpenAPI(rootFilePath);
      const result = await dereferenceOpenAPIElement(parseResult);

      assert.isTrue(isOpenApi3_1Element(result.api));
    });

    specify('should dereference $ref references', async function () {
      const parseResult = await parseOpenAPI(rootFilePath);
      const actual = await dereferenceOpenAPIElement(parseResult);
      const expected = loadJsonFile(path.join(fixturesPath, 'dereferenced.json'));

      assert.deepEqual(toValue(actual.api), expected);
    });
  });

  context('given ParseResultElement without retrievalURI metadata', function () {
    const openapiObject = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
    };

    specify('should throw DereferenceError when baseURI not provided', async function () {
      const parseResult = await parseOpenAPI(openapiObject);

      try {
        await dereferenceOpenAPIElement(parseResult);
        assert.fail('Expected DereferenceError to be thrown');
      } catch (error) {
        assert.instanceOf(error, DereferenceError);
        assert.include((error as DereferenceError).message, 'baseURI option is required');
      }
    });

    specify('should dereference when baseURI provided', async function () {
      const parseResult = await parseOpenAPI(openapiObject);
      const result = await dereferenceOpenAPIElement(parseResult, {
        resolve: { baseURI: 'https://example.com/openapi.json' },
      });

      assert.isTrue(isParseResultElement(result));
      assert.isTrue(isOpenApi3_1Element(result.api));
    });
  });
});
