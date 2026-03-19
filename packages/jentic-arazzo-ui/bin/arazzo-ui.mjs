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

const input = process.argv[2];

if (!input || input === '--help' || input === '-h') {
  console.log('Usage: arazzo-ui <url-or-file>\n');
  console.log('Open an Arazzo Document in the browser.\n');
  console.log('Examples:');
  console.log(
    '  npx @jentic/arazzo-ui https://arazzo-ui.jentic.com/petstore-order-workflow.arazzo.yaml',
  );
  console.log('  npx @jentic/arazzo-ui ./workflow.arazzo.yaml');
  process.exit(input ? 0 : 1);
}

let viewerURL;

if (urlUtils.isHttpUrl(input)) {
  viewerURL = `${BASE_URL}?document=${encodeURIComponent(input)}`;
} else {
  const filePath = resolve(input);
  try {
    const content = await readFile(filePath, 'utf-8');
    viewerURL = `${BASE_URL}#document=${encodeURIComponent(content)}`;
  } catch (err) {
    console.error(`Failed to read file: ${filePath}\n${err.message}`);
    process.exit(1);
  }
}

console.log(`Opening ${viewerURL}`);
openBrowser(viewerURL);
