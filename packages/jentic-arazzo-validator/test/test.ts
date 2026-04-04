import { assert } from 'chai';
import dedent from 'dedent';

import { validate, DiagnosticSeverity, createTextDocument } from '../src/index.ts';
import ApilintCodes from '../src/config/codes.ts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const specArazzoFullValid = fs
  .readFileSync(path.join(__dirname, 'fixtures', 'arazzo-full-valid.yaml'))
  .toString();

const specArazzoFullInvalid = fs
  .readFileSync(path.join(__dirname, 'fixtures', 'arazzo-full-invalid.yaml'))
  .toString();

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

  context('given valid Arazzo document from file', function () {
    specify('should not return errors', async function () {
      const textDocument = createTextDocument('memory://arazzo.yaml', specArazzoFullValid);
      const diagnostics = await validate(textDocument);
      const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
      assert.equal(errors.length, 0);
    });
  });

  context('given invalid Arazzo document from file', function () {
    specify('should return errors', async function () {
      const textDocument = createTextDocument('memory://arazzo.yaml', specArazzoFullInvalid);
      const diagnostics = await validate(textDocument);
      const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
      assert.isAbove(errors.length, 0);
    });
  });

  context('given Arazzo document missing required title in info', function () {
    const missingTitle = dedent`
      arazzo: '1.0.1'
      info:
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

    specify('should return ARAZZO_INFO_FIELD_TITLE_REQUIRED error', async function () {
      const textDocument = createTextDocument('memory://arazzo.yaml', missingTitle);
      const diagnostics = await validate(textDocument);
      assert.equal(
        ApilintCodes.ARAZZO_INFO_FIELD_TITLE_REQUIRED,
        9010200,
        'ARAZZO_INFO_FIELD_TITLE_REQUIRED should be diagnostic code 9010200',
      );
      const titleRequired = diagnostics.find(
        (d) => d.code === ApilintCodes.ARAZZO_INFO_FIELD_TITLE_REQUIRED,
      );
      assert.isDefined(titleRequired, 'expected diagnostic with code 9010200');
      assert.equal(titleRequired!.severity, DiagnosticSeverity.Error);
      assert.isTrue(
        titleRequired!.range.start.line < titleRequired!.range.end.line ||
          (titleRequired!.range.start.line === titleRequired!.range.end.line &&
            titleRequired!.range.start.character < titleRequired!.range.end.character),
        'range should have start position before end position',
      );
    });
  });

  context('given valid YAML represented as array', function () {
    const yamlArray = dedent`
      - item1
      - item2
      - item3
    `;

    specify('should return ARAZZO_NOT_DETECTED error', async function () {
      const textDocument = createTextDocument('memory://arazzo.yaml', yamlArray);
      const diagnostics = await validate(textDocument);
      const notDetected = diagnostics.find((d) => d.code === ApilintCodes.ARAZZO_NOT_DETECTED);
      assert.isDefined(notDetected, 'expected diagnostic with code 9000001');
      assert.equal(notDetected!.severity, DiagnosticSeverity.Error);
    });
  });

  context('given valid JSON represented as array', function () {
    const jsonArray = '["item1", "item2", "item3"]';

    specify('should return ARAZZO_NOT_DETECTED error', async function () {
      const textDocument = createTextDocument('memory://arazzo.json', jsonArray);
      const diagnostics = await validate(textDocument);
      const notDetected = diagnostics.find((d) => d.code === ApilintCodes.ARAZZO_NOT_DETECTED);
      assert.isDefined(notDetected, 'expected diagnostic with code 9000001');
      assert.equal(notDetected!.severity, DiagnosticSeverity.Error);
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

  context('given OpenAPI document instead of Arazzo', function () {
    const openApiDoc = dedent`
      openapi: '3.0.3'
      info:
        title: My API
        version: '1.0.0'
      paths: {}
    `;

    specify('should return ARAZZO_NOT_DETECTED error', async function () {
      const textDocument = createTextDocument('memory://openapi.yaml', openApiDoc);
      const diagnostics = await validate(textDocument);
      const notDetected = diagnostics.find((d) => d.code === ApilintCodes.ARAZZO_NOT_DETECTED);
      assert.isDefined(notDetected, 'expected diagnostic with code 9000001');
      assert.equal(notDetected!.severity, DiagnosticSeverity.Error);
    });
  });
});
