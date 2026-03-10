import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { isParseResultElement, ParseResultElement } from '@speclynx/apidom-datamodel';
import { isArazzoSpecification1Element } from '@speclynx/apidom-ns-arazzo-1';
import { isOpenApi3_1Element } from '@speclynx/apidom-ns-openapi-3-1';

import { parseArazzo } from '../src/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, 'fixtures', 'source-descriptions');

describe('parse', function () {
  context('given sourceDescriptions option', function () {
    context('when sourceDescriptions is false (default)', function () {
      const fixturePath = path.join(fixturesPath, 'arazzo-with-openapi.json');

      specify('should not parse source descriptions', async function () {
        const result = await parseArazzo(fixturePath, {
          parse: {
            parserOpts: {
              'arazzo-json-1': { sourceDescriptions: false },
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        assert.isTrue(isArazzoSpecification1Element(result.api));
        // only the main arazzo document should be in the result
        assert.strictEqual(result.length, 1);
      });
    });

    context('when sourceDescriptions is true', function () {
      const fixturePath = path.join(fixturesPath, 'arazzo-with-openapi.json');

      specify('should parse all source descriptions', async function () {
        const result = await parseArazzo(fixturePath, {
          parse: {
            parserOpts: {
              'arazzo-json-1': { sourceDescriptions: true },
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        assert.isTrue(isArazzoSpecification1Element(result.api));
        // main arazzo document + 1 source description
        assert.strictEqual(result.length, 2);

        const sdParseResult = result.get(1) as ParseResultElement;
        assert.isTrue(isParseResultElement(sdParseResult));
        assert.isTrue(sdParseResult.classes.includes('source-description'));
      });

      specify('should include source description metadata', async function () {
        const result = await parseArazzo(fixturePath, {
          parse: {
            parserOpts: {
              'arazzo-json-1': { sourceDescriptions: true },
            },
          },
        });

        const sdParseResult = result.get(1) as ParseResultElement;
        assert.strictEqual(sdParseResult.meta.get('name'), 'petStore');
        assert.strictEqual(sdParseResult.meta.get('type'), 'openapi');
      });

      specify('should work with global parserOpts flag', async function () {
        const result = await parseArazzo(fixturePath, {
          parse: {
            parserOpts: {
              sourceDescriptions: true,
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        assert.isTrue(isArazzoSpecification1Element(result.api));
        // main arazzo document + 1 source description
        assert.strictEqual(result.length, 2);

        const sdParseResult = result.get(1) as ParseResultElement;
        assert.isTrue(isParseResultElement(sdParseResult));
        assert.isTrue(sdParseResult.classes.includes('source-description'));
        assert.strictEqual(sdParseResult.meta.get('name'), 'petStore');
      });
    });

    context('when sourceDescriptions is array of names', function () {
      const fixturePath = path.join(fixturesPath, 'arazzo-multiple-sources.json');

      specify('should parse only named source descriptions', async function () {
        const result = await parseArazzo(fixturePath, {
          parse: {
            parserOpts: {
              'arazzo-json-1': { sourceDescriptions: ['petStore'] },
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        // main arazzo document + 1 selected source description (petStore only)
        assert.strictEqual(result.length, 2);

        const sdParseResult = result.get(1) as ParseResultElement;
        assert.strictEqual(sdParseResult.meta.get('name'), 'petStore');
      });
    });

    context('when source description is of type arazzo', function () {
      const fixturePath = path.join(fixturesPath, 'arazzo-with-arazzo.json');

      specify('should recursively parse arazzo source descriptions', async function () {
        const result = await parseArazzo(fixturePath, {
          parse: {
            parserOpts: {
              'arazzo-json-1': { sourceDescriptions: true },
              'arazzo-yaml-1': { sourceDescriptions: true },
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        // main arazzo + child arazzo
        assert.strictEqual(result.length, 2);

        // verify child arazzo was parsed
        const childArazzo = result.get(1) as ParseResultElement;
        assert.isTrue(isParseResultElement(childArazzo));
        assert.strictEqual(childArazzo.meta.get('name'), 'childWorkflows');
        assert.strictEqual(childArazzo.meta.get('type'), 'arazzo');
        assert.isTrue(isArazzoSpecification1Element(childArazzo.api));

        // verify child's openapi source description was recursively parsed (nested under childArazzo)
        assert.strictEqual(childArazzo.length, 2); // arazzo api + nested openapi
        const nestedOpenApi = childArazzo.get(1) as ParseResultElement;
        assert.isTrue(isParseResultElement(nestedOpenApi));
        assert.isTrue(nestedOpenApi.classes.includes('source-description'));
        assert.strictEqual(nestedOpenApi.meta.get('name'), 'childApi');
        assert.strictEqual(nestedOpenApi.meta.get('type'), 'openapi');
        // openapi was successfully parsed (no errors, api is OpenAPI 3.1 element)
        assert.strictEqual(nestedOpenApi.errors.length, 0);
        assert.isTrue(isOpenApi3_1Element(nestedOpenApi.api));
      });
    });

    context('when source descriptions have circular references', function () {
      const fixturePath = path.join(fixturesPath, 'cycle-a.json');

      specify('should detect cycles and add warning annotation', async function () {
        const result = await parseArazzo(fixturePath, {
          parse: {
            parserOpts: {
              'arazzo-json-1': { sourceDescriptions: true },
              'arazzo-yaml-1': { sourceDescriptions: true },
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        // main arazzo (cycle-a) + cycle-b source description
        assert.strictEqual(result.length, 2);

        // cycle-b's parse result contains the cycle-a reference which triggers cycle detection
        const cycleBParseResult = result.get(1) as ParseResultElement;
        assert.isTrue(isParseResultElement(cycleBParseResult));
        assert.isTrue(cycleBParseResult.classes.includes('source-description'));

        // the nested parse result for cycle-a should contain the cycle warning
        const nestedParseResult = cycleBParseResult.get(1) as ParseResultElement;
        assert.isTrue(isParseResultElement(nestedParseResult));

        // check for the cycle detection warning annotation
        const annotation = nestedParseResult.get(0);
        assert.strictEqual(annotation?.element, 'annotation');
        assert.isTrue(annotation?.classes?.includes('warning'));
        assert.isTrue(String(annotation?.toValue()).includes('already been visited'));
      });
    });

    context('when sourceDescriptionsMaxDepth is set', function () {
      const fixturePath = path.join(fixturesPath, 'arazzo-with-arazzo.json');

      specify('should limit recursion depth', async function () {
        const result = await parseArazzo(fixturePath, {
          parse: {
            parserOpts: {
              'arazzo-json-1': { sourceDescriptions: true, sourceDescriptionsMaxDepth: 1 },
              'arazzo-yaml-1': { sourceDescriptions: true, sourceDescriptionsMaxDepth: 1 },
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        // main arazzo + child arazzo only (depth 1 stops further recursion)
        assert.strictEqual(result.length, 2);

        const childArazzo = result.get(1) as ParseResultElement;
        assert.isTrue(isArazzoSpecification1Element(childArazzo.api));
      });

      specify('should not parse any source descriptions when maxDepth is 0', async function () {
        const result = await parseArazzo(fixturePath, {
          parse: {
            parserOpts: {
              'arazzo-json-1': { sourceDescriptions: true, sourceDescriptionsMaxDepth: 0 },
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        // main arazzo document + error annotation for exceeded depth
        assert.strictEqual(result.length, 2);

        // the source description parse result should contain an error annotation
        const sdParseResult = result.get(1) as ParseResultElement;
        assert.isTrue(isParseResultElement(sdParseResult));
        assert.isUndefined(sdParseResult.api); // no parsed document due to depth limit

        const annotation = sdParseResult.get(0);
        assert.strictEqual(annotation?.element, 'annotation');
        assert.isTrue(annotation?.classes?.includes('error'));
      });
    });
  });
});
