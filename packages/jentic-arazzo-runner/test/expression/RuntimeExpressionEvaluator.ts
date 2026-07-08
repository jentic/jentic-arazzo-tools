import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { ObjectElement } from '@speclynx/apidom-datamodel';

import { DocumentRegistry, ArazzoDocument, RuntimeExpressionEvaluator } from '../../src/index.ts';
import type { RuntimeExpressionContext } from '../../src/index.ts';
import RuntimeExpressionError from '../../src/errors/RuntimeExpressionError.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, '..', 'fixtures');

describe('RuntimeExpressionEvaluator', function () {
  const baseContext: RuntimeExpressionContext = {
    request: {
      url: 'https://api.example.com/pets/42',
      method: 'GET',
      header: { 'Content-Type': 'application/json' },
      query: { page: '2' },
      path: { petId: '42' },
      body: { name: 'Rex' },
    },
    response: {
      statusCode: 200,
      header: { Server: 'nginx' },
      body: { pets: [{ id: 7, name: 'Rex' }], total: 1, nothing: null },
    },
    inputs: { username: 'alice', count: 42, active: true, empty: null },
    outputs: { token: 'abc' },
    steps: { getPet: { outputs: { pet: { id: 7, name: 'Rex' } } } },
    workflows: { login: { inputs: { user: 'bob' }, outputs: { token: 'xyz' } } },
  };

  context('evaluate', function () {
    let evaluator: RuntimeExpressionEvaluator;

    beforeEach(function () {
      evaluator = new RuntimeExpressionEvaluator(baseContext);
    });

    specify('should resolve $url', function () {
      assert.strictEqual(evaluator.evaluate('$url'), 'https://api.example.com/pets/42');
    });

    specify('should resolve $method', function () {
      assert.strictEqual(evaluator.evaluate('$method'), 'GET');
    });

    specify('should resolve $statusCode preserving number type', function () {
      assert.strictEqual(evaluator.evaluate('$statusCode'), 200);
    });

    specify('should resolve $request.header case-insensitively', function () {
      assert.strictEqual(evaluator.evaluate('$request.header.content-type'), 'application/json');
    });

    specify('should resolve $request.query', function () {
      assert.strictEqual(evaluator.evaluate('$request.query.page'), '2');
    });

    specify('should resolve $request.path', function () {
      assert.strictEqual(evaluator.evaluate('$request.path.petId'), '42');
    });

    specify('should resolve $request.body', function () {
      assert.deepEqual(evaluator.evaluate('$request.body'), { name: 'Rex' });
    });

    specify('should resolve $response.header case-insensitively', function () {
      assert.strictEqual(evaluator.evaluate('$response.header.server'), 'nginx');
    });

    specify('should resolve $response.body with a JSON Pointer preserving type', function () {
      assert.strictEqual(evaluator.evaluate('$response.body#/pets/0/id'), 7);
    });

    specify('should resolve $inputs preserving value type', function () {
      assert.strictEqual(evaluator.evaluate('$inputs.username'), 'alice');
      assert.strictEqual(evaluator.evaluate('$inputs.count'), 42);
      assert.strictEqual(evaluator.evaluate('$inputs.active'), true);
    });

    specify('should resolve $outputs', function () {
      assert.strictEqual(evaluator.evaluate('$outputs.token'), 'abc');
    });

    specify('should resolve $steps outputs', function () {
      assert.deepEqual(evaluator.evaluate('$steps.getPet.outputs.pet'), { id: 7, name: 'Rex' });
    });

    specify('should resolve $steps outputs with a JSON Pointer', function () {
      assert.strictEqual(evaluator.evaluate('$steps.getPet.outputs.pet#/name'), 'Rex');
    });

    specify('should resolve $workflows outputs', function () {
      assert.strictEqual(evaluator.evaluate('$workflows.login.outputs.token'), 'xyz');
    });

    specify('should resolve $workflows inputs', function () {
      assert.strictEqual(evaluator.evaluate('$workflows.login.inputs.user'), 'bob');
    });

    specify('should resolve a null value rather than treating it as missing', function () {
      assert.strictEqual(evaluator.evaluate('$inputs.empty'), null);
      assert.strictEqual(evaluator.evaluate('$response.body#/nothing'), null);
    });

    specify('should not resolve prototype members', function () {
      const lenient = new RuntimeExpressionEvaluator(baseContext, { strict: false });
      assert.isUndefined(lenient.evaluate('$inputs.constructor'));
      assert.isUndefined(lenient.evaluate('$inputs.toString'));
    });

    specify('should throw for a source on the wrong message side', function () {
      assert.throws(() => evaluator.evaluate('$response.query.page'), RuntimeExpressionError);
    });

    specify('should throw for an unresolvable reference in strict mode', function () {
      assert.throws(() => evaluator.evaluate('$inputs.missing'), RuntimeExpressionError);
    });

    specify('should throw for a JSON Pointer miss in strict mode', function () {
      assert.throws(() => evaluator.evaluate('$response.body#/nope'), RuntimeExpressionError);
    });

    specify(
      'should return undefined for an unresolvable reference in non-strict mode',
      function () {
        const lenient = new RuntimeExpressionEvaluator(baseContext, { strict: false });
        assert.isUndefined(lenient.evaluate('$inputs.missing'));
        assert.isUndefined(lenient.evaluate('$response.body#/nope'));
      },
    );

    specify('should throw for an invalid expression regardless of strict mode', function () {
      const lenient = new RuntimeExpressionEvaluator(baseContext, { strict: false });
      assert.throws(() => lenient.evaluate('$bogus'), RuntimeExpressionError);
    });

    specify('should drill JSON Pointers into an ApiDOM element body', function () {
      const apidom = new RuntimeExpressionEvaluator({
        response: { body: new ObjectElement({ pets: [{ id: 7 }] }) },
      });
      assert.strictEqual(apidom.evaluate('$response.body#/pets/0/id'), 7);
      assert.deepEqual(apidom.evaluate('$response.body'), { pets: [{ id: 7 }] });
    });
  });

  context('interpolate', function () {
    let evaluator: RuntimeExpressionEvaluator;

    beforeEach(function () {
      evaluator = new RuntimeExpressionEvaluator(baseContext);
    });

    specify('should replace an embedded expression with its string form', function () {
      assert.strictEqual(evaluator.interpolate('Bearer {$outputs.token}'), 'Bearer abc');
    });

    specify('should stringify a scalar value', function () {
      assert.strictEqual(evaluator.interpolate('count={$inputs.count}'), 'count=42');
    });

    specify('should JSON-serialize an object value', function () {
      assert.strictEqual(
        evaluator.interpolate('pet={$steps.getPet.outputs.pet}'),
        'pet={"id":7,"name":"Rex"}',
      );
    });

    specify('should replace every occurrence of a repeated expression', function () {
      assert.strictEqual(evaluator.interpolate('{$outputs.token}-{$outputs.token}'), 'abc-abc');
    });

    specify('should replace multiple distinct expressions in order', function () {
      assert.strictEqual(
        evaluator.interpolate('user={$inputs.username}&count={$inputs.count}'),
        'user=alice&count=42',
      );
    });

    specify('should not interpolate any expression when the template is unparseable', function () {
      // an unparseable brace segment (`{"x":1}`) makes the whole expression-string
      // fail to parse, so `extract` returns nothing and the template is left as-is.
      assert.strictEqual(
        evaluator.interpolate('{"x":1}-{$inputs.username}'),
        '{"x":1}-{$inputs.username}',
      );
    });

    specify('should not interpret replacement patterns in a resolved value', function () {
      const evil = new RuntimeExpressionEvaluator({ inputs: { v: 'A$&B' } });
      assert.strictEqual(evil.interpolate('x={$inputs.v}'), 'x=A$&B');
    });

    specify(
      'should not re-interpolate a resolved value that looks like an expression',
      function () {
        const nested = new RuntimeExpressionEvaluator({ inputs: { a: '{$inputs.b}', b: 'X' } });
        assert.strictEqual(nested.interpolate('{$inputs.a}{$inputs.b}'), '{$inputs.b}X');
      },
    );

    specify('should leave a string without embedded expressions unchanged', function () {
      assert.strictEqual(evaluator.interpolate('application/json'), 'application/json');
    });

    specify('should leave a braced literal that is not an expression unchanged', function () {
      assert.strictEqual(evaluator.interpolate('{"a":1}'), '{"a":1}');
    });

    specify('should interpolate a braced body-pointer expression', function () {
      assert.strictEqual(evaluator.interpolate('id={$response.body#/pets/0/id}'), 'id=7');
    });

    specify(
      'should render an unresolvable reference as empty string in non-strict mode',
      function () {
        const lenient = new RuntimeExpressionEvaluator(baseContext, { strict: false });
        assert.strictEqual(lenient.interpolate('x={$inputs.missing}'), 'x=');
      },
    );
  });

  context('resolve', function () {
    let evaluator: RuntimeExpressionEvaluator;

    beforeEach(function () {
      evaluator = new RuntimeExpressionEvaluator(baseContext);
    });

    specify('should resolve a bare expression to its typed value', function () {
      assert.strictEqual(evaluator.resolve('$inputs.count'), 42);
      assert.strictEqual(evaluator.resolve('$response.body#/pets/0/id'), 7);
    });

    specify('should treat a braced expression as string interpolation', function () {
      assert.strictEqual(evaluator.resolve('{$inputs.count}'), '42');
      assert.strictEqual(evaluator.resolve('{$inputs.active}'), 'true');
    });

    specify('should interpolate a mixed template to a string', function () {
      assert.strictEqual(evaluator.resolve('id-{$inputs.count}'), 'id-42');
    });

    specify('should return a literal string unchanged', function () {
      assert.strictEqual(evaluator.resolve('application/json'), 'application/json');
    });
  });

  context('$components', function () {
    let entryDoc: ArazzoDocument;
    let registry: DocumentRegistry;

    before(async function () {
      registry = new DocumentRegistry();
      entryDoc = await registry.acquireEntryDocument(
        path.join(fixturesPath, 'arazzo-with-components', 'workflow.arazzo.yaml'),
      );
    });

    specify('should resolve a component from the entry document', function () {
      const evaluator = new RuntimeExpressionEvaluator(
        {},
        { document: entryDoc, registry, strict: false },
      );
      const parameter = evaluator.evaluate('$components.parameters.petId') as {
        name?: string;
        value?: string;
      };
      assert.strictEqual(parameter?.name, 'petId');
    });

    specify('should return undefined for a missing component in non-strict mode', function () {
      const evaluator = new RuntimeExpressionEvaluator(
        {},
        { document: entryDoc, registry, strict: false },
      );
      assert.isUndefined(evaluator.evaluate('$components.parameters.missing'));
    });

    specify('should return undefined when no document is configured', function () {
      const evaluator = new RuntimeExpressionEvaluator({}, { strict: false });
      assert.isUndefined(evaluator.evaluate('$components.parameters.petId'));
    });
  });

  context('$sourceDescriptions', function () {
    let entryDoc: ArazzoDocument;
    let registry: DocumentRegistry;

    before(async function () {
      registry = new DocumentRegistry();
      entryDoc = await registry.acquireEntryDocument(
        path.join(fixturesPath, 'petstore-order-workflow.arazzo.yaml'),
      );
      // the executor is responsible for having acquired the referenced document
      await registry.acquire(entryDoc.resolveSourceDescriptionURI('petstoreAPI')!);
    });

    specify('should resolve a referenced operation by operationId', function () {
      const evaluator = new RuntimeExpressionEvaluator(
        {},
        { document: entryDoc, registry, strict: false },
      );
      const operation = evaluator.evaluate('$sourceDescriptions.petstoreAPI.getPetById') as {
        operationId?: string;
      };
      assert.strictEqual(operation?.operationId, 'getPetById');
    });

    specify('should return undefined for an unknown source name', function () {
      const evaluator = new RuntimeExpressionEvaluator(
        {},
        { document: entryDoc, registry, strict: false },
      );
      assert.isUndefined(evaluator.evaluate('$sourceDescriptions.unknown.getPetById'));
    });

    specify('should return undefined for an unknown reference', function () {
      const evaluator = new RuntimeExpressionEvaluator(
        {},
        { document: entryDoc, registry, strict: false },
      );
      assert.isUndefined(evaluator.evaluate('$sourceDescriptions.petstoreAPI.doesNotExist'));
    });

    specify(
      'should return undefined when the referenced document is not loaded',
      async function () {
        const freshRegistry = new DocumentRegistry();
        const freshEntry = await freshRegistry.acquireEntryDocument(
          path.join(fixturesPath, 'petstore-order-workflow.arazzo.yaml'),
        );
        const evaluator = new RuntimeExpressionEvaluator(
          {},
          { document: freshEntry, registry: freshRegistry, strict: false },
        );
        assert.isUndefined(evaluator.evaluate('$sourceDescriptions.petstoreAPI.getPetById'));
      },
    );
  });

  context('criterion context expressions', function () {
    // The `context` of a Criterion Object is a runtime expression whose resolved
    // value is what the criterion's condition is then evaluated against.
    // https://spec.openapis.org/arazzo/v1.0.1.html#criterion-object
    let evaluator: RuntimeExpressionEvaluator;

    beforeEach(function () {
      evaluator = new RuntimeExpressionEvaluator(baseContext);
    });

    // simple criterion `condition: $statusCode == 200` — the condition is a
    // simple expression, but `$statusCode` is the runtime expression within it.
    specify('should resolve $statusCode as a number for a simple condition', function () {
      assert.strictEqual(evaluator.evaluate('$statusCode'), 200);
    });

    // regex criterion `context: $statusCode` / `condition: '^200$'`
    specify('should resolve the $statusCode context of a regex criterion', function () {
      assert.strictEqual(evaluator.evaluate('$statusCode'), 200);
    });

    // jsonpath criterion `context: $response.body` / `condition: $[?count(@.pets) > 0]`
    specify('should resolve the $response.body context of a jsonpath criterion', function () {
      assert.deepEqual(evaluator.evaluate('$response.body'), {
        pets: [{ id: 7, name: 'Rex' }],
        total: 1,
        nothing: null,
      });
    });

    // failure action criterion `condition: $statusCode == 503`
    specify('should resolve $statusCode for a failure-action condition', function () {
      const failed = new RuntimeExpressionEvaluator({ response: { statusCode: 503 } });
      assert.strictEqual(failed.evaluate('$statusCode'), 503);
    });

    // components criterion `condition: $statusCode == 401`
    specify('should resolve $statusCode for a components condition', function () {
      const unauthorized = new RuntimeExpressionEvaluator({ response: { statusCode: 401 } });
      assert.strictEqual(unauthorized.evaluate('$statusCode'), 401);
    });

    // the braced form used in the JSON `{$statusCode == 401}` is a string
    // template; the runtime expression alone still resolves to its typed value.
    specify('should preserve the number type so a condition compares correctly', function () {
      assert.strictEqual(evaluator.evaluate('$statusCode'), 200);
      assert.notStrictEqual(evaluator.evaluate('$statusCode') as unknown, '200');
    });
  });
});
