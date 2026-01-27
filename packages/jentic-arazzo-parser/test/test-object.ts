import { assert } from 'chai';
import { isParseResultElement } from '@speclynx/apidom-datamodel';
import { isArazzoSpecification1Element } from '@speclynx/apidom-ns-arazzo-1';

import { parse } from '../src/index.ts';
import ParseError from '../src/errors/ParseError.ts';

describe('parse', function () {
  context('given plain object', function () {
    const arazzoObject = {
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
    };

    specify('should return ParseResultElement', async function () {
      const result = await parse(arazzoObject);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain ArazzoSpecification1Element as api', async function () {
      const result = await parse(arazzoObject);

      assert.isTrue(isArazzoSpecification1Element(result.api));
    });

    specify('should not be empty', async function () {
      const result = await parse(arazzoObject);

      assert.isFalse(result.isEmpty);
    });
  });

  context('given null', function () {
    specify('should throw ParseError', async function () {
      try {
        // @ts-expect-error testing invalid input
        await parse(null);
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
        await parse(undefined);
        assert.fail('Expected ParseError to be thrown');
      } catch (error) {
        assert.instanceOf(error, ParseError);
      }
    });
  });

  context('given number', function () {
    specify('should throw ParseError', async function () {
      try {
        // @ts-expect-error testing invalid input
        await parse(42);
        assert.fail('Expected ParseError to be thrown');
      } catch (error) {
        assert.instanceOf(error, ParseError);
      }
    });
  });
});
