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

  context('given Criterion Expression Type Object', function () {
    const withExpressionType = (expressionType: string) => dedent`
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
              successCriteria:
                - context: $response.body
                  condition: $.id
                  type: ${expressionType}
    `;
    const expressionTypeCodes = [
      ApilintCodes.ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_TYPE_REQUIRED,
      ApilintCodes.ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_TYPE_TYPE,
      ApilintCodes.ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_TYPE_EQUALS,
      ApilintCodes.ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_VERSION_REQUIRED,
      ApilintCodes.ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_VERSION_TYPE,
    ];

    specify(
      'should return ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_TYPE_EQUALS error',
      async function () {
        const textDocument = createTextDocument(
          'memory://arazzo.yaml',
          withExpressionType('{ type: bogus, version: rfc9535 }'),
        );
        const diagnostics = await validate(textDocument);
        const typeEquals = diagnostics.find(
          (d) => d.code === ApilintCodes.ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_TYPE_EQUALS,
        );
        assert.isDefined(typeEquals, 'expected diagnostic with code 9110102');
        assert.equal(typeEquals!.severity, DiagnosticSeverity.Error);
      },
    );

    specify(
      'should return ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_VERSION_REQUIRED error',
      async function () {
        const textDocument = createTextDocument(
          'memory://arazzo.yaml',
          withExpressionType('{ type: jsonpath }'),
        );
        const diagnostics = await validate(textDocument);
        const versionRequired = diagnostics.find(
          (d) => d.code === ApilintCodes.ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_VERSION_REQUIRED,
        );
        assert.isDefined(versionRequired, 'expected diagnostic with code 9110200');
        assert.equal(versionRequired!.severity, DiagnosticSeverity.Error);
      },
    );

    specify('should not return Criterion Expression Type errors when valid', async function () {
      const textDocument = createTextDocument(
        'memory://arazzo.yaml',
        withExpressionType('{ type: jsonpath, version: draft-goessner-dispatch-jsonpath-00 }'),
      );
      const diagnostics = await validate(textDocument);
      const expressionTypeErrors = diagnostics.filter((d) =>
        expressionTypeCodes.includes(d.code as number),
      );
      assert.lengthOf(expressionTypeErrors, 0);
    });
  });

  context('given workflowId uniqueness', function () {
    const findUniqueErrors = (diagnostics: Awaited<ReturnType<typeof validate>>) =>
      diagnostics.filter((d) => d.code === ApilintCodes.ARAZZO_WORKFLOW_FIELD_WORKFLOW_ID_UNIQUE);

    specify(
      'should not return ARAZZO_WORKFLOW_FIELD_WORKFLOW_ID_UNIQUE error when a step references a workflow',
      async function () {
        const spec = dedent`
          arazzo: '1.0.1'
          info:
            title: My Workflow
            version: '1.0.0'
          sourceDescriptions:
            - name: myApi
              type: openapi
              url: https://example.com/openapi.json
          workflows:
            - workflowId: adopt
              steps:
                - stepId: create
                  operationId: myApi.createPet
            - workflowId: run
              steps:
                - stepId: sub
                  workflowId: adopt
                - stepId: subAgain
                  workflowId: adopt
        `;
        const textDocument = createTextDocument('memory://arazzo.yaml', spec);
        const diagnostics = await validate(textDocument);
        const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
        assert.lengthOf(findUniqueErrors(diagnostics), 0);
        assert.lengthOf(errors, 0);
      },
    );

    specify(
      'should return ARAZZO_WORKFLOW_FIELD_WORKFLOW_ID_UNIQUE errors for duplicate workflows',
      async function () {
        const spec = dedent`
          arazzo: '1.0.1'
          info:
            title: My Workflow
            version: '1.0.0'
          sourceDescriptions:
            - name: myApi
              type: openapi
              url: https://example.com/openapi.json
          workflows:
            - workflowId: adopt
              steps:
                - stepId: create
                  operationId: myApi.createPet
            - workflowId: adopt
              steps:
                - stepId: create
                  operationId: myApi.createPet
            - workflowId: run
              steps:
                - stepId: sub
                  workflowId: adopt
        `;
        const textDocument = createTextDocument('memory://arazzo.yaml', spec);
        const diagnostics = await validate(textDocument);
        const uniqueErrors = findUniqueErrors(diagnostics);
        assert.lengthOf(uniqueErrors, 2);
        assert.deepEqual(
          uniqueErrors.map((d) => d.range.start.line),
          [9, 13],
        );
        assert.isTrue(uniqueErrors.every((d) => d.severity === DiagnosticSeverity.Error));
      },
    );
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
