import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { isParseResultElement } from '@speclynx/apidom-datamodel';
import {
  isArazzoSpecification1Element,
  isWorkflowElement,
  ArazzoSpecification1Element,
  WorkflowElement,
} from '@speclynx/apidom-ns-arazzo-1';
import { toValue } from '@speclynx/apidom-core';
import { parse } from '@jentic/arazzo-parser';

import { dereferenceApiDOM, DereferenceError } from '../../src/index.ts';
import { loadJsonFile } from '../helpers.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, 'fixtures', 'dereference-apidom');

/**
 * Test cases for dereferenceApiDOM:
 *
 * | Case | Scenario                                              | Expected behavior            |
 * |------|-------------------------------------------------------|------------------------------|
 * | 1    | ParseResultElement + retrievalURI                     | uses retrievalURI as baseURI |
 * | 2    | ParseResultElement - retrievalURI + baseURI           | uses provided baseURI        |
 * | 3    | ParseResultElement - retrievalURI - baseURI           | throws DereferenceError      |
 * | 4    | Child element + parseResult + retrievalURI            | sets up refSet automatically |
 * | 5    | Child element + parseResult - retrievalURI + baseURI  | sets up refSet with baseURI  |
 * | 6    | Child element + parseResult - retrievalURI - baseURI  | throws DereferenceError      |
 */
describe('dereferenceApiDOM', function () {
  context('given ParseResultElement with retrievalURI metadata', function () {
    const rootFilePath = path.join(fixturesPath, 'root.json');

    specify('should return ParseResultElement', async function () {
      const parseResult = await parse(rootFilePath);
      const result = await dereferenceApiDOM(parseResult);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain ArazzoSpecification1Element as api', async function () {
      const parseResult = await parse(rootFilePath);
      const result = await dereferenceApiDOM(parseResult);

      assert.isTrue(isArazzoSpecification1Element(result.api));
    });

    specify('should dereference reusable objects', async function () {
      const parseResult = await parse(rootFilePath);
      const actual = await dereferenceApiDOM(parseResult);
      const expected = loadJsonFile(path.join(fixturesPath, 'dereferenced.json'));

      assert.deepEqual(toValue(actual), expected);
    });
  });

  context('given child element with parseResult in strategyOpts', function () {
    const rootFilePath = path.join(fixturesPath, 'root.json');

    specify('should dereference reusable objects in child element', async function () {
      const parseResult = await parse(rootFilePath);
      const api = parseResult.api as ArazzoSpecification1Element;
      const workflow = api.workflows!.get(0) as WorkflowElement;

      // pass parseResult via strategyOpts to provide access to full document for component resolution
      const result = await dereferenceApiDOM(workflow, {
        dereference: { strategyOpts: { parseResult } },
      });

      // verify the result is a WorkflowElement
      assert.isTrue(isWorkflowElement(result));

      // verify the parameter reference was dereferenced
      const resultValue = toValue(result) as {
        steps: Array<{ parameters: Array<unknown> }>;
      };
      assert.deepEqual(resultValue.steps[0].parameters[0], {
        name: 'resourceId',
        in: 'path',
        value: '$inputs.resourceId',
      });
    });
  });

  context('given child element with parseResult without retrievalURI metadata', function () {
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
              parameters: [
                {
                  reference: '$components.parameters.ResourceId',
                },
              ],
            },
          ],
        },
      ],
      components: {
        parameters: {
          ResourceId: {
            name: 'resourceId',
            in: 'path',
            value: '$inputs.resourceId',
          },
        },
      },
    };

    specify('should throw DereferenceError when baseURI not provided', async function () {
      const parseResult = await parse(arazzoObject);
      const api = parseResult.api as ArazzoSpecification1Element;
      const workflow = api.workflows!.get(0) as WorkflowElement;

      try {
        await dereferenceApiDOM(workflow, {
          dereference: { strategyOpts: { parseResult } },
        });
        assert.fail('Expected DereferenceError to be thrown');
      } catch (error) {
        assert.instanceOf(error, DereferenceError);
        assert.include((error as DereferenceError).message, 'baseURI option is required');
      }
    });

    specify('should dereference reusable objects when baseURI provided', async function () {
      const parseResult = await parse(arazzoObject);
      const api = parseResult.api as ArazzoSpecification1Element;
      const workflow = api.workflows!.get(0) as WorkflowElement;

      const result = await dereferenceApiDOM(workflow, {
        resolve: { baseURI: 'https://example.com/arazzo.json' },
        dereference: { strategyOpts: { parseResult } },
      });

      assert.isTrue(isWorkflowElement(result));

      const resultValue = toValue(result) as {
        steps: Array<{ parameters: Array<unknown> }>;
      };
      assert.deepEqual(resultValue.steps[0].parameters[0], {
        name: 'resourceId',
        in: 'path',
        value: '$inputs.resourceId',
      });
    });
  });

  context('given ParseResultElement without retrievalURI metadata', function () {
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
              parameters: [
                {
                  reference: '$components.parameters.ResourceId',
                },
              ],
            },
          ],
        },
      ],
      components: {
        parameters: {
          ResourceId: {
            name: 'resourceId',
            in: 'path',
            value: '$inputs.resourceId',
          },
        },
      },
    };

    specify('should throw DereferenceError when baseURI not provided', async function () {
      const parseResult = await parse(arazzoObject);

      try {
        await dereferenceApiDOM(parseResult);
        assert.fail('Expected DereferenceError to be thrown');
      } catch (error) {
        assert.instanceOf(error, DereferenceError);
        assert.include((error as DereferenceError).message, 'baseURI option is required');
      }
    });

    specify('should dereference reusable objects when baseURI provided', async function () {
      const parseResult = await parse(arazzoObject);
      const result = await dereferenceApiDOM(parseResult, {
        resolve: { baseURI: 'https://example.com/arazzo.json' },
      });

      assert.isTrue(isParseResultElement(result));
      assert.isTrue(isArazzoSpecification1Element(result.api));
    });
  });
});
