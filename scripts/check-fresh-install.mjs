#!/usr/bin/env node

/**
 * Checks that the published packages work when installed without the repo lockfile,
 * the way consumers install them.
 *
 * The lockfile can hide dependency drift: a floating range in a published package can
 * resolve to a release built on a different ApiDOM major. npm then nests a second ApiDOM
 * copy, elements from one copy fail the `instanceof` checks of another, and the validator
 * silently reports nothing (see jentic/jentic-arazzo-tools#351).
 *
 * Requires the packages to be built first (`npm run build:es`).
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packages = [
  'jentic-arazzo-parser',
  'jentic-arazzo-resolver',
  'jentic-arazzo-runner',
  'jentic-arazzo-validator',
];
const fixturesDir = path.join(rootDir, 'packages', 'jentic-arazzo-validator', 'test', 'fixtures');

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arazzo-fresh-install-'));
const tarballsDir = path.join(workDir, 'tarballs');
const appDir = path.join(workDir, 'app');

const npm = (args, cwd) =>
  execFileSync('npm', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

const failures = [];

try {
  fs.mkdirSync(tarballsDir);
  fs.mkdirSync(appDir);

  // pack each package as it would be published
  for (const pkg of packages) {
    npm(
      ['pack', '--silent', '--pack-destination', tarballsDir],
      path.join(rootDir, 'packages', pkg),
    );
  }

  // install the tarballs into an empty project, ignoring the repo lockfile
  fs.writeFileSync(
    path.join(appDir, 'package.json'),
    JSON.stringify({ name: 'fresh-install-check', private: true, type: 'module' }, null, 2),
  );
  const tarballs = fs.readdirSync(tarballsDir).map((file) => path.join(tarballsDir, file));
  npm(
    ['install', '--no-package-lock', '--no-audit', '--no-fund', '--ignore-scripts', ...tarballs],
    appDir,
  );

  // every @speclynx package must be installed exactly once
  const copies = new Map();
  const collect = (nodeModulesDir) => {
    if (!fs.existsSync(nodeModulesDir)) return;
    for (const entry of fs.readdirSync(nodeModulesDir)) {
      if (entry.startsWith('.')) continue;
      const entryDir = path.join(nodeModulesDir, entry);
      const packageDirs = entry.startsWith('@')
        ? fs.readdirSync(entryDir).map((name) => path.join(entryDir, name))
        : [entryDir];
      for (const packageDir of packageDirs) {
        const manifestPath = path.join(packageDir, 'package.json');
        if (fs.existsSync(manifestPath)) {
          const { name, version } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          if (name?.startsWith('@speclynx/')) {
            const location = path.relative(appDir, packageDir);
            copies.set(name, [...(copies.get(name) ?? []), `${version} (${location})`]);
          }
        }
        collect(path.join(packageDir, 'node_modules'));
      }
    }
  };
  collect(path.join(appDir, 'node_modules'));

  for (const [name, found] of copies) {
    if (found.length > 1) {
      failures.push(`${name} is installed ${found.length} times:\n    ${found.join('\n    ')}`);
    }
  }
  console.log(`Found ${copies.size} @speclynx packages in the fresh install`);

  // the validator must still report problems in an invalid document
  const checkScript = path.join(appDir, 'check.mjs');
  fs.writeFileSync(
    checkScript,
    `
import { readFileSync } from 'node:fs';
import { validate, createTextDocument, DiagnosticSeverity } from '@jentic/arazzo-validator';

const countErrors = async (file) => {
  const textDocument = createTextDocument('memory://arazzo.yaml', readFileSync(file, 'utf8'));
  const diagnostics = await validate(textDocument);
  return diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error && d.source === 'apilint').length;
};

console.log(JSON.stringify({
  valid: await countErrors(process.argv[2]),
  invalid: await countErrors(process.argv[3]),
}));
`,
  );
  const output = execFileSync(
    process.execPath,
    [
      checkScript,
      path.join(fixturesDir, 'arazzo-full-valid.yaml'),
      path.join(fixturesDir, 'arazzo-full-invalid.yaml'),
    ],
    { cwd: appDir, encoding: 'utf8' },
  );
  const { valid, invalid } = JSON.parse(output.trim().split('\n').at(-1));
  console.log(
    `Validator found ${valid} errors in the valid fixture, ${invalid} in the invalid one`,
  );

  if (valid !== 0) failures.push(`validator reported ${valid} errors for a valid document`);
  if (invalid === 0) failures.push('validator reported no errors for an invalid document');
} finally {
  fs.rmSync(workDir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\nFresh install check failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('Fresh install check passed');
