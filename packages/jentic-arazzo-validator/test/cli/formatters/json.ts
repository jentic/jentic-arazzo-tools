import { assert } from 'chai';
import { DiagnosticSeverity, type Diagnostic } from 'vscode-languageserver-types';

import { formatJSON } from '../../../src/cli/formatters/json.ts';

describe('json', function () {
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

  specify('should format diagnostics as JSON', function () {
    const output = formatJSON('/path/to/file.yaml', sampleDiagnostics);
    const parsed = JSON.parse(output);

    assert.equal(parsed.filePath, '/path/to/file.yaml');
    assert.lengthOf(parsed.diagnostics, 2);
    assert.equal(parsed.summary.total, 2);
    assert.equal(parsed.summary.truncated, false);
  });

  specify('should truncate with maxProblems', function () {
    const output = formatJSON('/path/to/file.yaml', sampleDiagnostics, { maxProblems: 1 });
    const parsed = JSON.parse(output);

    assert.lengthOf(parsed.diagnostics, 1);
    assert.equal(parsed.summary.total, 1);
    assert.equal(parsed.summary.truncated, true);
    assert.equal(parsed.summary.originalTotal, 2);
  });
});
