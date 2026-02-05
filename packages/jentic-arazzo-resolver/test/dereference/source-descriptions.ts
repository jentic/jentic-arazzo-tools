import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { isParseResultElement, ParseResultElement } from '@speclynx/apidom-datamodel';
import { isArazzoSpecification1Element } from '@speclynx/apidom-ns-arazzo-1';
import { isSwaggerElement } from '@speclynx/apidom-ns-openapi-2';
import { isOpenApi3_0Element } from '@speclynx/apidom-ns-openapi-3-0';
import { isOpenApi3_1Element } from '@speclynx/apidom-ns-openapi-3-1';

import { dereferenceArazzo } from '../../src/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, 'fixtures', 'source-descriptions');

describe('dereferenceArazzo', function () {
  context('given sourceDescriptions option', function () {
    context('when sourceDescriptions is false (default)', function () {
      const fixturePath = path.join(fixturesPath, 'arazzo-with-openapi.json');

      specify('should not dereference source descriptions', async function () {
        const result = await dereferenceArazzo(fixturePath, {
          dereference: {
            strategyOpts: {
              sourceDescriptions: false,
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

      specify('should dereference all source descriptions', async function () {
        const result = await dereferenceArazzo(fixturePath, {
          dereference: {
            strategyOpts: {
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
      });

      specify('should include source description metadata', async function () {
        const result = await dereferenceArazzo(fixturePath, {
          dereference: {
            strategyOpts: {
              sourceDescriptions: true,
            },
          },
        });

        const sdParseResult = result.get(1) as ParseResultElement;
        assert.strictEqual(sdParseResult.meta.get('name')!.toValue(), 'petStore');
        assert.strictEqual(sdParseResult.meta.get('type')!.toValue(), 'openapi');
      });
    });

    context('when sourceDescriptions is array of names', function () {
      const fixturePath = path.join(fixturesPath, 'arazzo-multiple-sources.json');

      specify('should dereference only named source descriptions', async function () {
        const result = await dereferenceArazzo(fixturePath, {
          dereference: {
            strategyOpts: {
              sourceDescriptions: ['petStore'],
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        // main arazzo document + 1 selected source description (petStore only)
        assert.strictEqual(result.length, 2);

        const sdParseResult = result.get(1) as ParseResultElement;
        assert.strictEqual(sdParseResult.meta.get('name')!.toValue(), 'petStore');
      });

      specify('should dereference multiple named source descriptions', async function () {
        const result = await dereferenceArazzo(fixturePath, {
          dereference: {
            strategyOpts: {
              sourceDescriptions: ['petStore', 'inventoryApi'],
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        // main arazzo document + 2 source descriptions
        assert.strictEqual(result.length, 3);
      });
    });

    context('when using strategy-specific options', function () {
      const fixturePath = path.join(fixturesPath, 'arazzo-with-openapi.json');

      specify('should accept arazzo-1 specific options', async function () {
        const result = await dereferenceArazzo(fixturePath, {
          dereference: {
            strategyOpts: {
              'arazzo-1': {
                sourceDescriptions: true,
              },
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        assert.isTrue(isArazzoSpecification1Element(result.api));
        // main arazzo document + 1 source description
        assert.strictEqual(result.length, 2);
      });
    });

    context('when source description is OpenAPI 2.0 (Swagger)', function () {
      const fixturePath = path.join(fixturesPath, 'arazzo-with-openapi-2.0.json');

      specify('should dereference OpenAPI 2.0 source description', async function () {
        const result = await dereferenceArazzo(fixturePath, {
          dereference: {
            strategyOpts: {
              sourceDescriptions: true,
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        assert.strictEqual(result.length, 2);

        const sdParseResult = result.get(1) as ParseResultElement;
        assert.isTrue(isParseResultElement(sdParseResult));
        assert.isTrue(isSwaggerElement(sdParseResult.api));
      });
    });

    context('when source description is OpenAPI 3.0', function () {
      const fixturePath = path.join(fixturesPath, 'arazzo-with-openapi-3.0.json');

      specify('should dereference OpenAPI 3.0 source description', async function () {
        const result = await dereferenceArazzo(fixturePath, {
          dereference: {
            strategyOpts: {
              sourceDescriptions: true,
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        assert.strictEqual(result.length, 2);

        const sdParseResult = result.get(1) as ParseResultElement;
        assert.isTrue(isParseResultElement(sdParseResult));
        assert.isTrue(isOpenApi3_0Element(sdParseResult.api));
      });
    });

    context('when source description is OpenAPI 3.1', function () {
      const fixturePath = path.join(fixturesPath, 'arazzo-with-openapi.json');

      specify('should dereference OpenAPI 3.1 source description', async function () {
        const result = await dereferenceArazzo(fixturePath, {
          dereference: {
            strategyOpts: {
              sourceDescriptions: true,
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        assert.strictEqual(result.length, 2);

        const sdParseResult = result.get(1) as ParseResultElement;
        assert.isTrue(isParseResultElement(sdParseResult));
        assert.isTrue(isOpenApi3_1Element(sdParseResult.api));
      });
    });

    context('when source description is Arazzo (nested)', function () {
      const fixturePath = path.join(fixturesPath, 'arazzo-with-arazzo.json');

      specify('should recursively dereference Arazzo source descriptions', async function () {
        const result = await dereferenceArazzo(fixturePath, {
          dereference: {
            strategyOpts: {
              sourceDescriptions: true,
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        // main arazzo + child arazzo
        assert.strictEqual(result.length, 2);

        const childArazzo = result.get(1) as ParseResultElement;
        assert.isTrue(isParseResultElement(childArazzo));
        assert.isTrue(isArazzoSpecification1Element(childArazzo.api));
        assert.strictEqual(childArazzo.meta.get('name')!.toValue(), 'childWorkflows');
        assert.strictEqual(childArazzo.meta.get('type')!.toValue(), 'arazzo');
      });
    });

    context('when source descriptions have circular references', function () {
      const fixturePath = path.join(fixturesPath, 'cycle-a.json');

      specify('should detect cycles and not hang', async function () {
        const result = await dereferenceArazzo(fixturePath, {
          dereference: {
            strategyOpts: {
              sourceDescriptions: true,
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        assert.isTrue(isArazzoSpecification1Element(result.api));
      });
    });

    context('when sourceDescriptionsMaxDepth is set', function () {
      const fixturePath = path.join(fixturesPath, 'arazzo-with-arazzo.json');

      specify('should limit recursion depth', async function () {
        const result = await dereferenceArazzo(fixturePath, {
          dereference: {
            strategyOpts: {
              sourceDescriptions: true,
              sourceDescriptionsMaxDepth: 1,
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        assert.isTrue(isArazzoSpecification1Element(result.api));
      });

      specify('should not dereference when maxDepth is 0', async function () {
        const result = await dereferenceArazzo(fixturePath, {
          dereference: {
            strategyOpts: {
              sourceDescriptions: true,
              sourceDescriptionsMaxDepth: 0,
            },
          },
        });

        assert.isTrue(isParseResultElement(result));
        assert.isTrue(isArazzoSpecification1Element(result.api));
      });
    });
  });
});
