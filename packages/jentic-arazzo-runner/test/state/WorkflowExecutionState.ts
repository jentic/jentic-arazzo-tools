import { assert } from 'chai';

import { WorkflowExecutionState, RuntimeExpressionEvaluator } from '../../src/index.ts';

describe('WorkflowExecutionState', function () {
  context('toContext', function () {
    specify('should expose inputs', function () {
      const state = new WorkflowExecutionState({ inputs: { username: 'alice' } });

      assert.deepEqual(state.toContext().inputs, { username: 'alice' });
    });

    specify('should default inputs to an empty object', function () {
      const state = new WorkflowExecutionState();

      assert.deepEqual(state.toContext().inputs, {});
    });

    specify('should expose accumulated step outputs under their stepId', function () {
      const state = new WorkflowExecutionState();
      state.setStepOutputs('login', { token: 'abc' });
      state.setStepOutputs('getPet', { pet: { id: 7 } });

      assert.deepEqual(state.toContext().steps, {
        login: { outputs: { token: 'abc' } },
        getPet: { outputs: { pet: { id: 7 } } },
      });
    });

    specify('should expose workflow outputs and inputs under their workflowId', function () {
      const state = new WorkflowExecutionState();
      state.setWorkflow('sub', { inputs: { a: 1 }, outputs: { b: 2 } });

      assert.deepEqual(state.toContext().workflows, {
        sub: { inputs: { a: 1 }, outputs: { b: 2 } },
      });
    });

    specify("should expose the workflow's own outputs", function () {
      const state = new WorkflowExecutionState();
      state.setOutput('token', 'xyz');

      assert.deepEqual(state.toContext().outputs, { token: 'xyz' });
    });

    specify('should layer the current step request and response onto the context', function () {
      const state = new WorkflowExecutionState();
      const request = { url: 'https://x/y', method: 'GET' };
      const response = { statusCode: 200, body: { ok: true } };

      const context = state.toContext(request, response);

      assert.strictEqual(context.request, request);
      assert.strictEqual(context.response, response);
    });

    specify('should omit request and response when not provided', function () {
      const state = new WorkflowExecutionState();
      const context = state.toContext();

      assert.isUndefined(context.request);
      assert.isUndefined(context.response);
    });
  });

  context('accumulation across a run (write → read loop)', function () {
    specify('should let a later step read an earlier step output via $steps', function () {
      const state = new WorkflowExecutionState({ inputs: { user: 'alice' } });

      // step 1 completes: resolve + store its outputs
      state.setStepOutputs('login', { token: 'secret-token' });

      // step 2 evaluates a parameter against the accumulated state
      const evaluator = new RuntimeExpressionEvaluator(state.toContext());
      assert.strictEqual(evaluator.evaluate('$steps.login.outputs.token'), 'secret-token');
      assert.strictEqual(evaluator.evaluate('$inputs.user'), 'alice');
    });

    specify('should read the current response only for the step being evaluated', function () {
      const state = new WorkflowExecutionState();
      state.setStepOutputs('prior', { id: 1 });

      const evaluator = new RuntimeExpressionEvaluator(
        state.toContext(undefined, { statusCode: 201, body: { created: true } }),
      );
      assert.strictEqual(evaluator.evaluate('$statusCode'), 201);
      assert.strictEqual(evaluator.evaluate('$response.body#/created'), true);
      assert.strictEqual(evaluator.evaluate('$steps.prior.outputs.id'), 1);
    });
  });

  context('outputs getter', function () {
    specify('should return a copy that does not mutate internal state', function () {
      const state = new WorkflowExecutionState();
      state.setOutput('a', 1);

      const snapshot = state.outputs;
      snapshot.a = 999;

      assert.deepEqual(state.outputs, { a: 1 });
    });
  });
});
