import { assert } from 'chai';
import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const binPath = path.resolve(import.meta.dirname, '../../bin/arazzo-validator.cjs');
const fixturesPath = path.resolve(
  import.meta.dirname,
  '../../../jentic-arazzo-resolver/test/dereference/fixtures/dereference',
);

describe('bin', function () {
  this.timeout(30000);

  describe('--help', function () {
    specify('should display help information', function () {
      const result = execFileSync('node', [binPath, '--help'], { encoding: 'utf-8' });

      assert.include(result, 'arazzo-validator');
      assert.include(result, '--format');
      assert.include(result, '--fail-severity');
      assert.include(result, '--quiet');
    });
  });

  describe('--version', function () {
    specify('should display version', function () {
      const result = execFileSync('node', [binPath, '--version'], { encoding: 'utf-8' });

      assert.match(result.trim(), /^\d+\.\d+\.\d+/);
    });
  });

  describe('valid file', function () {
    specify('should exit with code 0 and show success message', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      const { stdout } = await execFileAsync('node', [binPath, validFile]);

      assert.include(stdout, "No results with a severity of 'error' or higher found!");
    });
  });

  describe('--format json', function () {
    specify('should output valid JSON', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      const { stdout } = await execFileAsync('node', [binPath, '--format', 'json', validFile]);

      const parsed = JSON.parse(stdout);
      assert.property(parsed, 'filePath');
      assert.property(parsed, 'diagnostics');
      assert.property(parsed, 'summary');
    });
  });

  describe('--format github-actions', function () {
    specify('should output GitHub Actions format', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      const { stdout } = await execFileAsync('node', [
        binPath,
        '--format',
        'github-actions',
        validFile,
      ]);

      // valid file produces no diagnostics, so output is empty
      assert.equal(stdout, '');
    });
  });

  describe('--format codeframe', function () {
    specify('should show success message for valid file', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      const { stdout } = await execFileAsync('node', [binPath, '--format', 'codeframe', validFile]);

      assert.include(stdout, "No results with a severity of 'error' or higher found!");
    });
  });

  describe('--quiet', function () {
    specify('should suppress output', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      const { stdout } = await execFileAsync('node', [binPath, '--quiet', validFile]);

      assert.equal(stdout, '');
    });
  });

  describe('--verbose', function () {
    specify('should show additional information to stderr', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      const { stderr } = await execFileAsync('node', [binPath, '--verbose', validFile]);

      assert.include(stderr, 'Validating');
      assert.include(stderr, 'Completed in');
    });
  });

  describe('short options', function () {
    specify('-f should work as --format', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      const { stdout } = await execFileAsync('node', [binPath, '-f', 'json', validFile]);

      const parsed = JSON.parse(stdout);
      assert.property(parsed, 'filePath');
    });

    specify('-q should work as --quiet', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      const { stdout } = await execFileAsync('node', [binPath, '-q', validFile]);

      assert.equal(stdout, '');
    });

    specify('-v should work as --verbose', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      const { stderr } = await execFileAsync('node', [binPath, '-v', validFile]);

      assert.include(stderr, 'Validating');
    });
  });

  describe('option combinations', function () {
    specify('--verbose --format json should work together', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      const { stdout, stderr } = await execFileAsync('node', [
        binPath,
        '--verbose',
        '--format',
        'json',
        validFile,
      ]);

      // stdout should be valid JSON
      const parsed = JSON.parse(stdout);
      assert.property(parsed, 'filePath');
      // stderr should have verbose output
      assert.include(stderr, 'Validating');
    });

    specify('--quiet --format json should suppress stdout', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      const { stdout } = await execFileAsync('node', [
        binPath,
        '--quiet',
        '--format',
        'json',
        validFile,
      ]);

      assert.equal(stdout, '');
    });
  });

  describe('--fail-severity', function () {
    specify('should show success message with error level', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      const { stdout } = await execFileAsync('node', [
        binPath,
        '--fail-severity',
        'error',
        validFile,
      ]);

      assert.include(stdout, "No results with a severity of 'error' or higher found!");
    });

    specify('should show success message with warning level', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      const { stdout } = await execFileAsync('node', [
        binPath,
        '--fail-severity',
        'warning',
        validFile,
      ]);

      assert.include(stdout, "No results with a severity of 'warning' or higher found!");
    });

    specify('should show success message with info level', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      const { stdout } = await execFileAsync('node', [
        binPath,
        '--fail-severity',
        'info',
        validFile,
      ]);

      assert.include(stdout, "No results with a severity of 'info' or higher found!");
    });

    specify('should show success message with hint level', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      const { stdout } = await execFileAsync('node', [
        binPath,
        '--fail-severity',
        'hint',
        validFile,
      ]);

      assert.include(stdout, "No results with a severity of 'hint' or higher found!");
    });
  });

  describe('invalid options', function () {
    specify('should reject invalid format', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      try {
        await execFileAsync('node', [binPath, '--format', 'invalid', validFile]);
        assert.fail('Should have thrown');
      } catch (error: unknown) {
        const execError = error as { code: number; stderr: string };
        assert.notEqual(execError.code, 0);
      }
    });

    specify('should reject invalid fail-severity', async function () {
      const validFile = path.join(fixturesPath, 'root.yaml');
      try {
        await execFileAsync('node', [binPath, '--fail-severity', 'invalid', validFile]);
        assert.fail('Should have thrown');
      } catch (error: unknown) {
        const execError = error as { code: number; stderr: string };
        assert.notEqual(execError.code, 0);
      }
    });
  });

  describe('missing file', function () {
    specify('should exit with code 2', async function () {
      try {
        await execFileAsync('node', [binPath, '/nonexistent/file.yaml']);
        assert.fail('Should have thrown');
      } catch (error: unknown) {
        const execError = error as { code: number; stderr: string };
        assert.equal(execError.code, 2);
        assert.include(execError.stderr, 'Error');
      }
    });
  });

  describe('no input', function () {
    specify('should exit with code 2', async function () {
      try {
        await execFileAsync('node', [binPath]);
        assert.fail('Should have thrown');
      } catch (error: unknown) {
        const execError = error as { code: number; stderr: string };
        assert.equal(execError.code, 2);
        assert.include(execError.stderr, 'No input provided');
      }
    });
  });
});
