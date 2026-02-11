import { assert } from 'chai';
import dedent from 'dedent';

import { validate, DiagnosticSeverity, createTextDocument } from '../src/index.ts';

describe('validate', function () {
  this.timeout(10000);

  context('given valid Arazzo document', function () {
    const validArazzo = dedent`
      arazzo: '1.0.1'
      info:
        title: My Workflow
        version: '1.0.0'
      sourceDescriptions:
        - name: myApi
          type: openapi
          url: https://example.com/openapi.json
      workflows:
        - workflowId: myWorkflow
          steps:
            - stepId: step1
              operationId: myApi.getUsers
    `;

    specify('should return no errors', async function () {
      const textDocument = createTextDocument('memory://arazzo.yaml', validArazzo);
      const diagnostics = await validate(textDocument);
      const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
      assert.lengthOf(errors, 0);
    });
  });

  context('given invalid Arazzo document', function () {
    const invalidArazzo = dedent`
      arazzo: '1.0.1'
      info:
        title: My Workflow
    `;

    specify('should return errors', async function () {
      const textDocument = createTextDocument('memory://arazzo.yaml', invalidArazzo);
      const diagnostics = await validate(textDocument);
      const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
      assert.isAbove(errors.length, 0);
    });
  });

  // eslint-disable-next-line mocha/no-pending-tests
  context.skip('given valid YAML represented as array', function () {
    const yamlArray = dedent`
      - item1
      - item2
      - item3
    `;

    specify('should return errors', async function () {
      const textDocument = createTextDocument('memory://arazzo.yaml', yamlArray);
      const diagnostics = await validate(textDocument);
      const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
      assert.isAbove(errors.length, 0);
    });
  });

  // eslint-disable-next-line mocha/no-pending-tests
  context.skip('given valid JSON represented as array', function () {
    const jsonArray = '["item1", "item2", "item3"]';

    specify('should return errors', async function () {
      const textDocument = createTextDocument('memory://arazzo.json', jsonArray);
      const diagnostics = await validate(textDocument);
      const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
      assert.isAbove(errors.length, 0);
    });
  });

  context('given invalid YAML syntax', function () {
    // tabs mixed with spaces causes actual YAML syntax error
    const invalidYaml = "arazzo: '1.0.1'\ninfo:\n\t title: bad";

    specify('should return errors', async function () {
      const textDocument = createTextDocument('memory://arazzo.yaml', invalidYaml);
      const diagnostics = await validate(textDocument);
      const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
      assert.isAbove(errors.length, 0);
    });
  });

  context('given invalid JSON syntax', function () {
    const invalidJson = '{ "arazzo": "1.0.1", invalid }';

    specify('should return errors', async function () {
      const textDocument = createTextDocument('memory://arazzo.json', invalidJson);
      const diagnostics = await validate(textDocument);
      const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
      assert.isAbove(errors.length, 0);
    });
  });

  // eslint-disable-next-line mocha/no-pending-tests
  context.skip('given OpenAPI document instead of Arazzo', function () {
    const openApiDoc = dedent`
      openapi: '3.0.3'
      info:
        title: My API
        version: '1.0.0'
      paths: {}
    `;

    specify('should return errors', async function () {
      const textDocument = createTextDocument('memory://openapi.yaml', openApiDoc);
      const diagnostics = await validate(textDocument);
      const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
      assert.isAbove(errors.length, 0);
    });
  });
});
