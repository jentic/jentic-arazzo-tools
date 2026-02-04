import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { isParseResultElement } from '@speclynx/apidom-datamodel';
import { isOpenApi3_1Element } from '@speclynx/apidom-ns-openapi-3-1';

import { parseOpenAPI } from '../src/index.ts';
import ParseError from '../src/errors/ParseError.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, 'fixtures');

describe('parseOpenAPI', function () {
  context('given plain object', function () {
    const openapiObject = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    };

    specify('should return ParseResultElement', async function () {
      const result = await parseOpenAPI(openapiObject);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain OpenApi3_1Element as api', async function () {
      const result = await parseOpenAPI(openapiObject);

      assert.isTrue(isOpenApi3_1Element(result.api));
    });

    specify('should not be empty', async function () {
      const result = await parseOpenAPI(openapiObject);

      assert.isFalse(result.isEmpty);
    });
  });

  context('given inline JSON string', function () {
    const openapiJSON = JSON.stringify({
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
    });

    specify('should return ParseResultElement', async function () {
      const result = await parseOpenAPI(openapiJSON);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain OpenApi3_1Element as api', async function () {
      const result = await parseOpenAPI(openapiJSON);

      assert.isTrue(isOpenApi3_1Element(result.api));
    });
  });

  context('given inline YAML string', function () {
    const openapiYAML = `openapi: "3.1.0"
info:
  title: Test API
  version: "1.0.0"
paths: {}`;

    specify('should return ParseResultElement', async function () {
      const result = await parseOpenAPI(openapiYAML);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain OpenApi3_1Element as api', async function () {
      const result = await parseOpenAPI(openapiYAML);

      assert.isTrue(isOpenApi3_1Element(result.api));
    });
  });

  context('given file system path', function () {
    const fixturePath = path.join(fixturesPath, 'source-descriptions', 'openapi.json');

    specify('should return ParseResultElement', async function () {
      const result = await parseOpenAPI(fixturePath);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain OpenApi3_1Element as api', async function () {
      const result = await parseOpenAPI(fixturePath);

      assert.isTrue(isOpenApi3_1Element(result.api));
    });

    specify('should set retrievalURI metadata', async function () {
      const result = await parseOpenAPI(fixturePath);

      assert.isTrue(result.hasMetaProperty('retrievalURI'));
    });
  });

  context('given null', function () {
    specify('should throw ParseError', async function () {
      try {
        // @ts-expect-error testing invalid input
        await parseOpenAPI(null);
        assert.fail('Expected ParseError to be thrown');
      } catch (error) {
        assert.instanceOf(error, ParseError);
      }
    });
  });

  context('given undefined', function () {
    specify('should throw ParseError', async function () {
      try {
        // @ts-expect-error testing invalid input
        await parseOpenAPI(undefined);
        assert.fail('Expected ParseError to be thrown');
      } catch (error) {
        assert.instanceOf(error, ParseError);
      }
    });
  });

  context('given object with sourceMap option', function () {
    const openapiObject = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
    };

    specify('should include source maps when sourceMap is true', async function () {
      const result = await parseOpenAPI(openapiObject, {
        parse: { parserOpts: { sourceMap: true, strict: false } },
      });

      assert.isTrue(isParseResultElement(result));
      assert.isDefined(result.api!.startLine);
      assert.isDefined(result.api!.startCharacter);
      assert.isDefined(result.api!.endLine);
      assert.isDefined(result.api!.endCharacter);
    });
  });
});
