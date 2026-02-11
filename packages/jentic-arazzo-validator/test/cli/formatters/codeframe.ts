import { assert } from 'chai';
import { DiagnosticSeverity, type Diagnostic } from 'vscode-languageserver-types';

import { formatCodeframe } from '../../../src/cli/formatters/codeframe.ts';

describe('codeframe', function () {
  const sampleDiagnostics: Diagnostic[] = [
    {
      range: { start: { line: 1, character: 0 }, end: { line: 1, character: 4 } },
      message: 'Missing required field',
      severity: DiagnosticSeverity.Error,
      code: 'missing-field',
    },
  ];

  const sourceContent = `arazzo: "1.0.0"
info:
  title: Test`;

  specify('should format diagnostics with code snippets', function () {
    const output = formatCodeframe('/path/to/file.yaml', sampleDiagnostics, { sourceContent });

    assert.include(output, '/path/to/file.yaml');
    assert.include(output, 'Missing required field');
    assert.include(output, 'error');
    // should include line numbers
    assert.include(output, '1 |');
    assert.include(output, '2 |');
    // should include caret highlighting
    assert.include(output, '^^^^');
  });

  specify('should show context lines around the error', function () {
    const output = formatCodeframe('/path/to/file.yaml', sampleDiagnostics, { sourceContent });

    // should show line before (line 1)
    assert.include(output, 'arazzo');
    // should show error line (line 2)
    assert.include(output, 'info');
    // should show line after (line 3)
    assert.include(output, 'title');
  });

  specify('should work without source content (fallback to no snippets)', function () {
    const output = formatCodeframe('/path/to/file.yaml', sampleDiagnostics);

    assert.include(output, '/path/to/file.yaml');
    assert.include(output, 'Missing required field');
    // should not include code snippet elements
    assert.notInclude(output, '1 |');
  });

  specify('should return empty string for no diagnostics', function () {
    const output = formatCodeframe('/path/to/file.yaml', []);
    assert.equal(output, '');
  });

  specify('should respect maxProblems option', function () {
    const multipleDiagnostics: Diagnostic[] = [
      {
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
        message: 'First error',
        severity: DiagnosticSeverity.Error,
      },
      {
        range: { start: { line: 1, character: 0 }, end: { line: 1, character: 1 } },
        message: 'Second error',
        severity: DiagnosticSeverity.Error,
      },
    ];

    const output = formatCodeframe('/path/to/file.yaml', multipleDiagnostics, {
      maxProblems: 1,
      sourceContent,
    });

    assert.include(output, 'First error');
    assert.notInclude(output, 'Second error');
    assert.include(output, 'showing 1 of 2 problems');
  });
});
