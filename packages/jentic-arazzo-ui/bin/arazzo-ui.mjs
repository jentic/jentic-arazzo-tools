#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { url as urlUtils } from '@speclynx/apidom-reference/configuration/empty';

const BASE_URL = 'https://arazzo-ui.jentic.com';

function openBrowser(url) {
  const { platform } = process;

  const onError = (error) => {
    if (error) {
      console.error(`Could not open browser. Visit the URL manually:\n${url}`);
    }
  };

  if (platform === 'darwin') {
    execFile('open', [url], onError);
  } else if (platform === 'win32') {
    execFile('cmd', ['/c', 'start', '', url], onError);
  } else {
    execFile('xdg-open', [url], onError);
  }
}

const IGNORE_UNSUPPORTED_VERSION_FLAG = '--ignore-unsupported-version';

function printUsage() {
  console.log('Usage: arazzo-ui [options] <url-or-file>\n');
  console.log('Open an Arazzo Document in the browser.\n');
  console.log('Options:');
  console.log(
    `  ${IGNORE_UNSUPPORTED_VERSION_FLAG}  don't report documents declaring an unsupported Arazzo version`,
  );
  console.log('  -h, --help                    show this help\n');
  console.log('Examples:');
  console.log(
    '  npx @jentic/arazzo-ui https://arazzo-ui.jentic.com/petstore-order-workflow.arazzo.yaml',
  );
  console.log('  npx @jentic/arazzo-ui ./workflow.arazzo.yaml');
  console.log(`  npx @jentic/arazzo-ui ${IGNORE_UNSUPPORTED_VERSION_FLAG} ./workflow.arazzo.yaml`);
}

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printUsage();
  process.exit(0);
}

const ignoreUnsupportedVersion = args.includes(IGNORE_UNSUPPORTED_VERSION_FLAG);
const unknownOptions = args.filter(
  (arg) => arg.startsWith('-') && arg !== IGNORE_UNSUPPORTED_VERSION_FLAG,
);
const positionals = args.filter((arg) => !arg.startsWith('-'));

if (unknownOptions.length > 0) {
  console.error(`Unknown option: ${unknownOptions.join(', ')}\n`);
  printUsage();
  process.exit(1);
}

if (positionals.length !== 1) {
  printUsage();
  process.exit(1);
}

const [input] = positionals;
// viewer options go wherever the document goes: the query string for URLs, the hash for content
const optionParams = ignoreUnsupportedVersion ? '&ignoreUnsupportedVersion=true' : '';

let viewerURL;

if (urlUtils.isHttpUrl(input)) {
  viewerURL = `${BASE_URL}?document=${encodeURIComponent(input)}${optionParams}`;
} else {
  const filePath = resolve(input);
  try {
    const content = await readFile(filePath, 'utf-8');
    viewerURL = `${BASE_URL}#document=${encodeURIComponent(content)}${optionParams}`;
  } catch (err) {
    console.error(`Failed to read file: ${filePath}\n${err.message}`);
    process.exit(1);
  }
}

console.log(`Opening ${viewerURL}`);
openBrowser(viewerURL);
