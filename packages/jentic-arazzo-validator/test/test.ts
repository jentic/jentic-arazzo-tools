import { assert } from 'chai';
import dedent from 'dedent';

import { validate, validateURI, DiagnosticSeverity, createTextDocument } from '../src/index.ts';
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

      for (const version of [
        '1.1.0',
        '1.10.0',
        '"1.10.0"',
        '1.0.2',
        '2.0.0',
        "'3.1.4'",
        '10.0.0',
      ]) {
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

    specify(
      'should map diagnostics after the version on the same line back to the original positions',
      async function () {
        // minified JSON puts every diagnostic on the version's line
        const minified = (version: string) =>
          JSON.stringify({
            arazzo: version,
            info: { version: '1.0.0' },
            sourceDescriptions: [{ name: 'myApi', type: 'openapi', url: 'https://example.com' }],
            workflows: [{ workflowId: 'w', steps: [{ stepId: 's', operationId: 'x' }] }],
          });
        const supported = await validate(
          createTextDocument('memory://arazzo.json', minified('1.0.1')),
        );
        assert.isAbove(supported.length, 0);

        for (const version of ['1.1.0', '1.10.0', '1.100.200', '2.0.0', '10.20.30']) {
          const shift = version.length - '1.0.1'.length;
          const diagnostics = await validate(
            createTextDocument('memory://arazzo.json', minified(version)),
          );
          const shifted = supported.map((d) =>
            JSON.stringify([
              d.code,
              d.message,
              d.range.start.character + shift,
              d.range.end.character + shift,
            ]),
          );

          assert.sameMembers(
            diagnostics
              .filter((d) => !isVersionDiagnostic(d))
              .map((d) =>
                JSON.stringify([d.code, d.message, d.range.start.character, d.range.end.character]),
              ),
            shifted,
            version,
          );
        }
      },
    );

    specify('should report future major versions as unsupported', async function () {
      for (const version of ['2.0.0', '"3.1.4"', '10.0.0']) {
        const textDocument = createTextDocument('memory://arazzo.yaml', withVersion(version));
        const diagnostics = await validate(textDocument);
        const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);

        assert.lengthOf(errors, 1, version);
        assert.isTrue(isVersionDiagnostic(errors[0]), version);
      }
    });

    specify('should not detect versions older than the supported ones', async function () {
      for (const version of ['0.9.0', '"0.1.0"']) {
        const textDocument = createTextDocument('memory://arazzo.yaml', withVersion(version));
        const diagnostics = await validate(textDocument);

        assert.lengthOf(diagnostics, 1, version);
        assert.equal(diagnostics[0].code, ApilintCodes.ARAZZO_NOT_DETECTED, version);
      }
    });

    specify(
      'should detect malformed documents the same way as supported versions',
      async function () {
        const documents = [
          (v: string) => `arazzo: ${v}\ninfo:\n\t title: bad`,
          (v: string) => `{ "arazzo": "${v}", invalid }`,
          (v: string) => `arazzo: ${v}`,
        ];

        for (const document of documents) {
          const supported = await validate(createTextDocument('memory://a', document('1.0.1')));
          const future = await validate(createTextDocument('memory://a', document('2.0.0')));
          const supportedDetected = !supported.some(
            (d) => d.code === ApilintCodes.ARAZZO_NOT_DETECTED,
          );

          assert.equal(future.some(isVersionDiagnostic), supportedDetected, document('2.0.0'));
          assert.sameMembers(
            future.filter((d) => !isVersionDiagnostic(d)).map((d) => d.code),
            supported.map((d) => d.code),
            document('2.0.0'),
          );
        }
      },
    );

    context('with ignoreUnsupportedVersion option', function () {
      const options = { ignoreUnsupportedVersion: true };

      specify('should not report unsupported versions', async function () {
        for (const version of ["'1.1.0'", '2.0.0']) {
          const textDocument = createTextDocument('memory://arazzo.yaml', withVersion(version));
          const diagnostics = await validate(textDocument, {}, options);
          const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);

          assert.lengthOf(errors, 0, version);
        }
      });

      specify('should still validate against the latest supported version', async function () {
        const serialize = (d: Diagnostic) => JSON.stringify([d.code, d.message, d.range]);
        const supported = await validate(
          createTextDocument('memory://arazzo.yaml', specArazzoFullInvalid),
        );
        const content = specArazzoFullInvalid.replace(/^arazzo: 1\.0\.1$/m, 'arazzo: 1.1.0');
        const diagnostics = await validate(
          createTextDocument('memory://arazzo.yaml', content),
          {},
          options,
        );

        assert.isAbove(supported.length, 0);
        assert.sameMembers(diagnostics.map(serialize), supported.map(serialize));
      });

      specify('should not change results for supported versions', async function () {
        const textDocument = createTextDocument('memory://arazzo.yaml', specArazzoFullInvalid);
        const serialize = (d: Diagnostic) => JSON.stringify([d.code, d.message, d.range]);
        const withOption = await validate(textDocument, {}, options);
        const without = await validate(textDocument);

        assert.sameMembers(withOption.map(serialize), without.map(serialize));
      });

      specify('should be passed through by validateURI', async function () {
        const uri = path.join(__dirname, 'fixtures', 'arazzo-unsupported-version.yaml');

        const reported = await validateURI(uri);
        assert.isDefined(reported.find(isVersionDiagnostic));

        const ignored = await validateURI(uri, {}, {}, options);
        assert.isUndefined(ignored.find(isVersionDiagnostic));
        assert.lengthOf(
          ignored.filter((d) => d.severity === DiagnosticSeverity.Error),
          0,
        );
      });
    });
  });

  context('given Arazzo document with nested arazzo properties before the root field', function () {
    const serialize = (d: Diagnostic) => JSON.stringify([d.code, d.message, d.range]);
    const isVersionDiagnostic = (d: Diagnostic) =>
      d.code === ApilintCodes.ARAZZO_SPEC_FIELD_ARAZZO_VERSION_SUPPORTED;
    // info is missing its required title, so Arazzo rules must report it
    const json = (nestedKey: string, nestedVersion: string, rootVersion: string) =>
      JSON.stringify(
        {
          'x-example': { [nestedKey]: nestedVersion },
          arazzo: rootVersion,
          info: { version: '1.0.0' },
          sourceDescriptions: [
            { name: 'myApi', type: 'openapi', url: 'https://example.com/openapi.json' },
          ],
          workflows: [{ workflowId: 'w', steps: [{ stepId: 's', operationId: 'x' }] }],
        },
        null,
        2,
      );
    const validateJSON = (content: string) =>
      validate(createTextDocument('memory://arazzo.json', content));

    specify('should use a supported root version, not a nested unsupported one', async function () {
      const diagnostics = await validateJSON(json('arazzo', '1.1.0', '1.0.1'));

      assert.isUndefined(diagnostics.find(isVersionDiagnostic));
      assert.isDefined(
        diagnostics.find((d) => d.code === ApilintCodes.ARAZZO_INFO_FIELD_TITLE_REQUIRED),
        'expected Arazzo rules to run',
      );
    });

    specify(
      'should report an unsupported root version, not a nested supported one',
      async function () {
        const content = json('arazzo', '1.0.1', '1.1.0');
        const diagnostics = await validateJSON(content);
        const versionErrors = diagnostics.filter(isVersionDiagnostic);

        assert.lengthOf(versionErrors, 1);
        assert.include(versionErrors[0].message, 'Arazzo version 1.1.0');
        const rootOffset = content.indexOf('"arazzo": "1.1.0"') + '"arazzo": "'.length;
        const document = createTextDocument('memory://arazzo.json', content);
        assert.deepEqual(versionErrors[0].range, {
          start: document.positionAt(rootOffset),
          end: document.positionAt(rootOffset + '1.1.0'.length),
        });
        assert.isDefined(
          diagnostics.find((d) => d.code === ApilintCodes.ARAZZO_INFO_FIELD_TITLE_REQUIRED),
          'expected Arazzo rules to run',
        );
      },
    );

    specify('should report the same diagnostics as without the nested property', async function () {
      for (const [nestedVersion, rootVersion] of [
        ['1.1.0', '1.0.1'],
        ['1.0.1', '1.1.0'],
        ['2.0.0', '1.0.1'],
        ['1.0.1', '2.0.0'],
      ]) {
        // `arazzX` has the same length but isn't a detected arazzo property
        const expected = await validateJSON(json('arazzX', nestedVersion, rootVersion));
        const actual = await validateJSON(json('arazzo', nestedVersion, rootVersion));

        assert.sameMembers(
          actual.map(serialize),
          expected.map(serialize),
          `${nestedVersion} nested, ${rootVersion} root`,
        );
      }
    });

    specify('should handle nested flow mappings before the root field in YAML', async function () {
      for (const [nestedVersion, rootVersion, expectVersionError] of [
        ['1.1.0', '1.0.1', false],
        ['1.0.1', '2.0.0', true],
      ] as const) {
        const yaml = (key: string) => dedent`
          x-example: {"${key}": "${nestedVersion}"}
          arazzo: ${rootVersion}
          info:
            version: '1.0.0'
          sourceDescriptions:
            - name: myApi
              type: openapi
              url: https://example.com/openapi.json
          workflows:
            - workflowId: w
              steps:
                - stepId: s
                  operationId: x
        `;
        const expected = await validate(createTextDocument('memory://arazzo.yaml', yaml('arazzX')));
        const actual = await validate(createTextDocument('memory://arazzo.yaml', yaml('arazzo')));

        assert.equal(actual.some(isVersionDiagnostic), expectVersionError, rootVersion);
        assert.sameMembers(actual.map(serialize), expected.map(serialize), rootVersion);
        assert.isDefined(
          actual.find((d) => d.code === ApilintCodes.ARAZZO_INFO_FIELD_TITLE_REQUIRED),
          'expected Arazzo rules to run',
        );
      }
    });

    specify(
      'should not treat a nested arazzo property alone as an Arazzo document',
      async function () {
        const diagnostics = await validateJSON(
          JSON.stringify({ openapi: '3.1.0', 'x-arazzo': { arazzo: '1.0.1' } }),
        );
        assert.lengthOf(diagnostics, 1);
        assert.equal(diagnostics[0].code, ApilintCodes.ARAZZO_NOT_DETECTED);
      },
    );

    context('in YAML scalar values and comments', function () {
      // `arazzo` text inside scalars and comments before the root field; the two parameter
      // names differ only by a literal backslash escape, which single quotes keep as-is
      const yaml = (word: string, rootVersion: string) =>
        [
          'workflows:',
          '  - workflowId: w',
          '    description: |',
          `      Example document: {"${word}": "1.1.0"}`,
          '    steps:',
          '      - stepId: s',
          '        operationId: x',
          '        parameters:',
          `          - name: '{"${word}":"1.0.1"}'`,
          '            in: query',
          `            value: plain "${word}":"1.0.1" text`,
          `          - name: '{"\\u0061${word.slice(1)}":"1.0.1"}'`,
          '            in: query',
          '            value: b',
          `# "${word}": "1.1.0"`,
          `arazzo: ${rootVersion}`,
          'info:',
          "  version: '1'",
          'sourceDescriptions:',
          '  - name: api',
          '    url: https://example.com/openapi.json',
          '',
        ].join('\n');

      for (const rootVersion of ['1.0.1', '2.0.0']) {
        specify(`should not change scalar values (root version ${rootVersion})`, async function () {
          // `arazzX` has the same length but isn't matched by the detection regexes
          const expected = await validate(
            createTextDocument('memory://arazzo.yaml', yaml('arazzX', rootVersion)),
          );
          const actual = await validate(
            createTextDocument('memory://arazzo.yaml', yaml('arazzo', rootVersion)),
          );

          assert.isUndefined(
            actual.find((d) => d.code === ApilintCodes.ARAZZO_STEP_FIELD_PARAMETERS_UNIQUE),
            'parameter names must stay distinct',
          );
          assert.equal(actual.some(isVersionDiagnostic), rootVersion === '2.0.0');
          assert.isDefined(
            actual.find((d) => d.code === ApilintCodes.ARAZZO_INFO_FIELD_TITLE_REQUIRED),
            'expected Arazzo rules to run',
          );
          assert.sameMembers(actual.map(serialize), expected.map(serialize));
        });
      }

      specify('should map related information back to the original positions', async function () {
        // the block scalar is respelled on one line, so later lines move up in the prepared copy
        const yamlWithSyntaxError = (word: string) =>
          [
            'x-example: |',
            `  {"${word}": "1.0.0"}`,
            '  second line',
            '  third line',
            'arazzo: 1.0.1',
            'info:',
            '  title: t',
            ' bad: x',
            '',
          ].join('\n');
        const validateWithRelated = (content: string) =>
          validate(createTextDocument('memory://arazzo.yaml', content), {
            validationContext: { relatedInformation: true },
          });
        const serializeRelated = (d: Diagnostic) =>
          JSON.stringify([d.code, d.range, d.relatedInformation]);

        const expected = await validateWithRelated(yamlWithSyntaxError('arazzX'));
        const actual = await validateWithRelated(yamlWithSyntaxError('arazzo'));

        const related = actual.filter((d) => d.relatedInformation !== undefined);
        assert.isNotEmpty(related, 'expected a syntax diagnostic with related information');
        for (const diagnostic of related) {
          for (const { location } of diagnostic.relatedInformation!) {
            assert.deepEqual(location.range, diagnostic.range);
          }
        }
        assert.sameMembers(actual.map(serializeRelated), expected.map(serializeRelated));
        assert.isTrue(
          actual.every((d) => d.relatedInformation !== undefined || !('relatedInformation' in d)),
          'diagnostics without related information must not gain the property',
        );
      });
    });
  });
});
