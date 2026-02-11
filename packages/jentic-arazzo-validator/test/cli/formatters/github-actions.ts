import { assert } from 'chai';
import { DiagnosticSeverity, type Diagnostic } from 'vscode-languageserver-types';

import { formatGitHubActions } from '../../../src/cli/formatters/github-actions.ts';

describe('github-actions', function () {
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

  specify('should format diagnostics as GitHub Actions commands', function () {
    const output = formatGitHubActions('/path/to/file.yaml', sampleDiagnostics);

    assert.include(output, '::error file=/path/to/file.yaml');
    assert.include(output, '::warning file=/path/to/file.yaml');
    assert.include(output, 'line=11');
    assert.include(output, 'col=5');
    assert.include(output, 'Missing required field');
  });

  specify('should return empty string for no diagnostics', function () {
    const output = formatGitHubActions('/path/to/file.yaml', []);
    assert.equal(output, '');
  });
});
