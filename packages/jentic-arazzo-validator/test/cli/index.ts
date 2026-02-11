import { assert } from 'chai';
import { DiagnosticSeverity, type Diagnostic } from 'vscode-languageserver-types';

import { severityMap, hasFailures, formatDiagnostics } from '../../src/cli/index.ts';

describe('cli', function () {
  describe('severityMap', function () {
    specify('should map error to DiagnosticSeverity.Error', function () {
      assert.equal(severityMap.error, DiagnosticSeverity.Error);
    });

    specify('should map warning to DiagnosticSeverity.Warning', function () {
      assert.equal(severityMap.warning, DiagnosticSeverity.Warning);
    });

    specify('should map info to DiagnosticSeverity.Information', function () {
      assert.equal(severityMap.info, DiagnosticSeverity.Information);
    });

    specify('should map hint to DiagnosticSeverity.Hint', function () {
      assert.equal(severityMap.hint, DiagnosticSeverity.Hint);
    });
  });

  describe('hasFailures', function () {
    const errorDiagnostic: Diagnostic = {
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
      message: 'Error',
      severity: DiagnosticSeverity.Error,
    };

    const warningDiagnostic: Diagnostic = {
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
      message: 'Warning',
      severity: DiagnosticSeverity.Warning,
    };

    const hintDiagnostic: Diagnostic = {
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
      message: 'Hint',
      severity: DiagnosticSeverity.Hint,
    };

    specify('should return true when errors exist and fail-severity is error', function () {
      assert.isTrue(hasFailures([errorDiagnostic], 'error'));
    });

    specify('should return false when only warnings exist and fail-severity is error', function () {
      assert.isFalse(hasFailures([warningDiagnostic], 'error'));
    });

    specify('should return true when warnings exist and fail-severity is warning', function () {
      assert.isTrue(hasFailures([warningDiagnostic], 'warning'));
    });

    specify('should return true when errors exist and fail-severity is warning', function () {
      assert.isTrue(hasFailures([errorDiagnostic], 'warning'));
    });

    specify('should return false when only hints exist and fail-severity is warning', function () {
      assert.isFalse(hasFailures([hintDiagnostic], 'warning'));
    });

    specify('should return false for empty diagnostics', function () {
      assert.isFalse(hasFailures([], 'error'));
    });
  });

  describe('formatDiagnostics', function () {
    const diagnostics: Diagnostic[] = [
      {
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
        message: 'Test message',
        severity: DiagnosticSeverity.Error,
      },
    ];

    specify('should use stylish formatter by default', function () {
      const output = formatDiagnostics('stylish', '/test.yaml', diagnostics);
      assert.include(output, '/test.yaml');
      assert.include(output, 'Test message');
    });

    specify('should use json formatter when specified', function () {
      const output = formatDiagnostics('json', '/test.yaml', diagnostics);
      const parsed = JSON.parse(output);
      assert.equal(parsed.filePath, '/test.yaml');
    });

    specify('should use github-actions formatter when specified', function () {
      const output = formatDiagnostics('github-actions', '/test.yaml', diagnostics);
      assert.include(output, '::error file=/test.yaml');
    });

    specify('should use codeframe formatter when specified', function () {
      const sourceContent = 'line1\nline2\nline3';
      const output = formatDiagnostics('codeframe', '/test.yaml', diagnostics, { sourceContent });
      assert.include(output, '/test.yaml');
      assert.include(output, 'Test message');
      assert.include(output, '1 |'); // should include line numbers
    });
  });
});
