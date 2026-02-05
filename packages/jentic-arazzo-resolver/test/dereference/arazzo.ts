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
import { parseArazzo } from '@jentic/arazzo-parser';

import { dereferenceArazzo, dereferenceArazzoElement, DereferenceError } from '../../src/index.ts';
import { createHTTPServer, loadJsonFile, type ServerTerminable } from '../helpers.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('dereferenceArazzo', function () {
  const fixturesPath = path.join(__dirname, 'fixtures', 'dereference');

  context('given file system path to JSON file', function () {
    const rootFilePath = path.join(fixturesPath, 'root.json');

    specify('should return ParseResultElement', async function () {
      const result = await dereferenceArazzo(rootFilePath);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain ArazzoSpecification1Element as api', async function () {
      const result = await dereferenceArazzo(rootFilePath);

      assert.isTrue(isArazzoSpecification1Element(result.api));
    });

    specify('should dereference reusable objects', async function () {
      const actual = await dereferenceArazzo(rootFilePath);
      const expected = loadJsonFile(path.join(fixturesPath, 'dereferenced.json'));

      assert.deepEqual(toValue(actual), expected);
    });
  });

  context('given file system path to YAML file', function () {
    const rootFilePath = path.join(fixturesPath, 'root.yaml');

    specify('should return ParseResultElement', async function () {
      const result = await dereferenceArazzo(rootFilePath);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain ArazzoSpecification1Element as api', async function () {
      const result = await dereferenceArazzo(rootFilePath);

      assert.isTrue(isArazzoSpecification1Element(result.api));
    });

    specify('should dereference reusable objects', async function () {
      const actual = await dereferenceArazzo(rootFilePath);
      const expected = loadJsonFile(path.join(fixturesPath, 'dereferenced.json'));

      assert.deepEqual(toValue(actual), expected);
    });
  });

  context('given HTTP URL to JSON file', function () {
    let server: ServerTerminable;

    beforeEach(async function () {
      server = await createHTTPServer({ cwd: fixturesPath });
    });

    afterEach(async function () {
      await server.terminate();
    });

    specify('should return ParseResultElement', async function () {
      const result = await dereferenceArazzo(`http://localhost:${server.port}/root.json`);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain ArazzoSpecification1Element as api', async function () {
      const result = await dereferenceArazzo(`http://localhost:${server.port}/root.json`);

      assert.isTrue(isArazzoSpecification1Element(result.api));
    });

    specify('should dereference reusable objects', async function () {
      const actual = await dereferenceArazzo(`http://localhost:${server.port}/root.json`);
      const expected = loadJsonFile(path.join(fixturesPath, 'dereferenced.json'));

      assert.deepEqual(toValue(actual), expected);
    });
  });

  context('given HTTP URL to YAML file', function () {
    let server: ServerTerminable;

    beforeEach(async function () {
      server = await createHTTPServer({ cwd: fixturesPath });
    });

    afterEach(async function () {
      await server.terminate();
    });

    specify('should return ParseResultElement', async function () {
      const result = await dereferenceArazzo(`http://localhost:${server.port}/root.yaml`);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain ArazzoSpecification1Element as api', async function () {
      const result = await dereferenceArazzo(`http://localhost:${server.port}/root.yaml`);

      assert.isTrue(isArazzoSpecification1Element(result.api));
    });

    specify('should dereference reusable objects', async function () {
      const actual = await dereferenceArazzo(`http://localhost:${server.port}/root.yaml`);
      const expected = loadJsonFile(path.join(fixturesPath, 'dereferenced.json'));

      assert.deepEqual(toValue(actual), expected);
    });
  });

  context('given invalid URI', function () {
    specify('should throw DereferenceError', async function () {
      try {
        await dereferenceArazzo('/non/existent/path.json');
        assert.fail('Expected DereferenceError to be thrown');
      } catch (error) {
        assert.instanceOf(error, DereferenceError);
        assert.include((error as DereferenceError).message, '/non/existent/path.json');
      }
    });
  });
});

/**
 * Test cases for dereferenceArazzoElement:
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
describe('dereferenceArazzoElement', function () {
  const fixturesPath = path.join(__dirname, 'fixtures', 'dereference-element');

  context('given ParseResultElement with retrievalURI metadata', function () {
    const rootFilePath = path.join(fixturesPath, 'root.json');

    specify('should return ParseResultElement', async function () {
      const parseResult = await parseArazzo(rootFilePath);
      const result = await dereferenceArazzoElement(parseResult);

      assert.isTrue(isParseResultElement(result));
    });

    specify('should contain ArazzoSpecification1Element as api', async function () {
      const parseResult = await parseArazzo(rootFilePath);
      const result = await dereferenceArazzoElement(parseResult);

      assert.isTrue(isArazzoSpecification1Element(result.api));
    });

    specify('should dereference reusable objects', async function () {
      const parseResult = await parseArazzo(rootFilePath);
      const actual = await dereferenceArazzoElement(parseResult);
      const expected = loadJsonFile(path.join(fixturesPath, 'dereferenced.json'));

      assert.deepEqual(toValue(actual), expected);
    });
  });

  context('given child element with parseResult in strategyOpts', function () {
    const rootFilePath = path.join(fixturesPath, 'root.json');

    specify('should dereference reusable objects in child element', async function () {
      const parseResult = await parseArazzo(rootFilePath);
      const api = parseResult.api as ArazzoSpecification1Element;
      const workflow = api.workflows!.get(0) as WorkflowElement;

      // pass parseResult via strategyOpts to provide access to full document for component resolution
      const result = await dereferenceArazzoElement(workflow, {
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
      const parseResult = await parseArazzo(arazzoObject);
      const api = parseResult.api as ArazzoSpecification1Element;
      const workflow = api.workflows!.get(0) as WorkflowElement;

      try {
        await dereferenceArazzoElement(workflow, {
          dereference: { strategyOpts: { parseResult } },
        });
        assert.fail('Expected DereferenceError to be thrown');
      } catch (error) {
        assert.instanceOf(error, DereferenceError);
        assert.include((error as DereferenceError).message, 'baseURI option is required');
      }
    });

    specify('should dereference reusable objects when baseURI provided', async function () {
      const parseResult = await parseArazzo(arazzoObject);
      const api = parseResult.api as ArazzoSpecification1Element;
      const workflow = api.workflows!.get(0) as WorkflowElement;

      const result = await dereferenceArazzoElement(workflow, {
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
      const parseResult = await parseArazzo(arazzoObject);

      try {
        await dereferenceArazzoElement(parseResult);
        assert.fail('Expected DereferenceError to be thrown');
      } catch (error) {
        assert.instanceOf(error, DereferenceError);
        assert.include((error as DereferenceError).message, 'baseURI option is required');
      }
    });

    specify('should dereference reusable objects when baseURI provided', async function () {
      const parseResult = await parseArazzo(arazzoObject);
      const result = await dereferenceArazzoElement(parseResult, {
        resolve: { baseURI: 'https://example.com/arazzo.json' },
      });

      assert.isTrue(isParseResultElement(result));
      assert.isTrue(isArazzoSpecification1Element(result.api));
    });
  });
});
