import { assert } from 'chai';
import dedent from 'dedent';

import { validate, DiagnosticSeverity, createTextDocument } from '../src/index.ts';
import type { Diagnostic } from '../src/index.ts';
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

  context('given Arazzo document with unsupported version', function () {
    const withVersion = (version: string) => dedent`
      arazzo: ${version}
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
    const isVersionDiagnostic = (d: Diagnostic) =>
      d.code === ApilintCodes.ARAZZO_SPEC_FIELD_ARAZZO_VERSION_SUPPORTED;

    specify('should return unsupported version error pointing at the version', async function () {
      const textDocument = createTextDocument('memory://arazzo.yaml', withVersion("'1.1.0'"));
      const diagnostics = await validate(textDocument);
      const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);

      assert.lengthOf(errors, 1);
      assert.isTrue(isVersionDiagnostic(errors[0]));
      assert.include(errors[0].message, '1.1.0');
      assert.include(errors[0].message, 'not supported');
      assert.deepEqual(errors[0].range, {
        start: { line: 0, character: 9 },
        end: { line: 0, character: 14 },
      });
    });

    specify(
      'should not return unsupported version error for supported versions',
      async function () {
        for (const version of ['1.0.0', '1.0.1', "'1.0.1'", '"1.0.0"']) {
          const textDocument = createTextDocument('memory://arazzo.yaml', withVersion(version));
          const diagnostics = await validate(textDocument);
          assert.isUndefined(diagnostics.find(isVersionDiagnostic), version);
        }
      },
    );

    specify('should run all rules of the latest supported version', async function () {
      const rangeOf = (d: Diagnostic) => JSON.stringify([d.code, d.message, d.range]);
      const supported = await validate(
        createTextDocument('memory://arazzo.yaml', specArazzoFullInvalid),
      );

      for (const version of ['1.1.0', '1.10.0', '"1.10.0"', '1.0.2']) {
        const content = specArazzoFullInvalid.replace(/^arazzo: 1\.0\.1$/m, `arazzo: ${version}`);
        assert.notEqual(content, specArazzoFullInvalid);
        const diagnostics = await validate(createTextDocument('memory://arazzo.yaml', content));

        assert.lengthOf(diagnostics.filter(isVersionDiagnostic), 1, version);
        // version line differs in length, so compare diagnostics on other lines by exact range
        assert.sameMembers(
          diagnostics.filter((d) => !isVersionDiagnostic(d) && d.range.start.line > 0).map(rangeOf),
          supported.filter((d) => d.range.start.line > 0).map(rangeOf),
          version,
        );
        assert.equal(diagnostics.length, supported.length + 1, version);
      }
    });

    specify(
      'should validate JSON documents against the latest supported version',
      async function () {
        const json = JSON.stringify(
          {
            arazzo: '1.1.0',
            info: { version: '1.0.0' },
            sourceDescriptions: [
              { name: 'myApi', type: 'openapi', url: 'https://example.com/openapi.json' },
            ],
            workflows: [
              { workflowId: 'myWorkflow', steps: [{ stepId: 'step1', operationId: 'x' }] },
            ],
          },
          null,
          2,
        );
        const diagnostics = await validate(createTextDocument('memory://arazzo.json', json));

        const versionError = diagnostics.find(isVersionDiagnostic);
        assert.isDefined(versionError);
        assert.deepEqual(versionError!.range, {
          start: { line: 1, character: 13 },
          end: { line: 1, character: 18 },
        });
        assert.isDefined(
          diagnostics.find((d) => d.code === ApilintCodes.ARAZZO_INFO_FIELD_TITLE_REQUIRED),
          'expected Arazzo rules to run',
        );
      },
    );
  });
});
