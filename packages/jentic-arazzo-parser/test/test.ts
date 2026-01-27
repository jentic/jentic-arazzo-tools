import { assert, expect } from 'chai';
import dedent from 'dedent';
import { isParseResultElement } from '@speclynx/apidom-datamodel';
import { isArazzoSpecification1Element } from '@speclynx/apidom-ns-arazzo-1';
import { sexprs } from '@speclynx/apidom-core';

import { parse } from '../src/index.ts';
import ParseError from '../src/errors/ParseError.ts';

describe('parse', function () {
  context('given inline Arazzo JSON document', function () {
    const arazzoJson = JSON.stringify({
      arazzo: '1.0.1',
      info: {
        title: 'Test API Workflow',
        version: '1.0.0',
      },
      sourceDescriptions: [
        {
          name: 'testApi',
          type: 'openapi',
          url: 'https://example.com/openapi.json',
        },
      ],
      workflows: [
        {
          workflowId: 'test-workflow',
          steps: [
            {
              stepId: 'step1',
              operationId: 'getResource',
            },
          ],
        },
      ],
    });

    specify('should return ParseResultElement', async function () {
      const result = await parse(arazzoJson);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should not be empty', async function () {
      const result = await parse(arazzoJson);

      assert.isFalse(result.isEmpty);
    });

    specify('should contain ArazzoSpecification1Element as api', async function () {
      const result = await parse(arazzoJson);

      assert.isTrue(isArazzoSpecification1Element(result.api));
    });

    specify('should have no errors', async function () {
      const result = await parse(arazzoJson);

      assert.strictEqual(result.errors.length, 0);
    });

    specify('should match snapshot', async function () {
      const result = await parse(arazzoJson);

      expect(sexprs(result.api!)).toMatchSnapshot();
    });
  });

  context('given inline Arazzo YAML document', function () {
    const arazzoYaml = dedent`
      arazzo: '1.0.1'
      info:
        title: Test API Workflow
        version: '1.0.0'
      sourceDescriptions:
        - name: testApi
          type: openapi
          url: https://example.com/openapi.json
      workflows:
        - workflowId: test-workflow
          steps:
            - stepId: step1
              operationId: getResource
    `;

    specify('should return ParseResultElement', async function () {
      const result = await parse(arazzoYaml);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain ArazzoSpecification1Element as api', async function () {
      const result = await parse(arazzoYaml);

      assert.isTrue(isArazzoSpecification1Element(result.api));
    });
  });

  context('given invalid Arazzo document', function () {
    specify('should throw ParseError', async function () {
      try {
        await parse('{ invalid json }');
        assert.fail('Expected ParseError to be thrown');
      } catch (error) {
        assert.instanceOf(error, ParseError);
      }
    });

    specify('should include original error as cause', async function () {
      try {
        await parse('{ invalid json }');
        assert.fail('Expected ParseError to be thrown');
      } catch (error) {
        assert.instanceOf(error, ParseError);
        assert.isDefined((error as ParseError).cause);
      }
    });
  });

  context('given options', function () {
    const arazzoJson = JSON.stringify({
      arazzo: '1.0.1',
      info: {
        title: 'Test',
        version: '1.0.0',
      },
      sourceDescriptions: [
        {
          name: 'test',
          type: 'openapi',
          url: 'https://example.com/openapi.json',
        },
      ],
      workflows: [],
    });

    specify('should respect strict option', async function () {
      const result = await parse(arazzoJson, { strict: false });

      assert.isTrue(isParseResultElement(result));
    });

    specify('should respect sourceMap option', async function () {
      // sourceMap requires strict: false since strict mode uses native parsers without source map support
      const result = await parse(arazzoJson, { sourceMap: true, strict: false });

      assert.isTrue(isParseResultElement(result));
    });
  });
});
