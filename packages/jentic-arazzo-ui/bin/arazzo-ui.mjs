#!/usr/bin/env node

import { exec } from 'node:child_process';

const BASE_URL = 'https://arazzo-ui.jentic.com';

function openBrowser(url) {
  const { platform } = process;
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start ""' : 'xdg-open';

  exec(`${command} "${url}"`, (error) => {
    if (error) {
      console.error(`Could not open browser. Visit the URL manually:\n${url}`);
    }
  });
}

const url = process.argv[2];

if (!url || url === '--help' || url === '-h') {
  console.log('Usage: arazzo-ui <url>\n');
  console.log('Open an Arazzo document in the browser.\n');
  console.log('Example:');
  console.log(
    '  npx @jentic/arazzo-ui https://arazzo-ui.jentic.com/petstore-order-workflow.arazzo.yaml',
  );
  process.exit(url ? 0 : 1);
}

const viewerURL = `${BASE_URL}?document=${encodeURIComponent(url)}`;
console.log(`Opening ${viewerURL}`);
openBrowser(viewerURL);
