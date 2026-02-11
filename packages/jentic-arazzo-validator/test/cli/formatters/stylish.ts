import { assert } from 'chai';
import { DiagnosticSeverity, type Diagnostic } from 'vscode-languageserver-types';

import { formatStylish } from '../../../src/cli/formatters/stylish.ts';

describe('stylish', function () {
  const sampleDiagnostics: Diagnostic[] = [
    {
      range: { start: { line: 10, character: 4 }, end: { line: 10, character: 10 } },
      message: 'Missing required field',
      severity: DiagnosticSeverity.Error,
      code: 'missing-field',
    },
    {
      range: { start: { line: 20, character: 2 }, end: { line: 20, character: 8 } },
      message: 'Unused workflow',
      severity: DiagnosticSeverity.Warning,
      code: 'unused-workflow',
    },
  ];

  specify('should format diagnostics in stylish format', function () {
    const output = formatStylish('/path/to/file.yaml', sampleDiagnostics);

    assert.include(output, '/path/to/file.yaml');
    assert.include(output, '11:5'); // 0-indexed to 1-indexed
    assert.include(output, 'Missing required field');
    assert.include(output, 'error');
    assert.include(output, 'warning');
    assert.include(output, '2 problems');
  });

  specify('should return empty string for no diagnostics', function () {
    const output = formatStylish('/path/to/file.yaml', []);
    assert.equal(output, '');
  });

  specify('should respect maxProblems option', function () {
    const output = formatStylish('/path/to/file.yaml', sampleDiagnostics, { maxProblems: 1 });

    assert.include(output, 'Missing required field');
    assert.notInclude(output, 'Unused workflow');
    assert.include(output, 'showing 1 of 2 problems');
  });
});
