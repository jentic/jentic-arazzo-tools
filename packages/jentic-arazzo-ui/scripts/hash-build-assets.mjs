/**
 * Adds content hashes to build assets and updates index.html references.
 * This ensures browsers fetch fresh files after each deployment.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { resolve, basename, extname } from 'node:path';

const buildDir = resolve(import.meta.dirname, '../build');

const assets = ['arazzo-ui-standalone.js', 'arazzo-ui.css'];

const renames = {};

for (const asset of assets) {
  const filePath = resolve(buildDir, asset);
  const content = readFileSync(filePath);
  const hash = createHash('md5').update(content).digest('hex').slice(0, 8);
  const ext = extname(asset);
  const base = basename(asset, ext);
  const hashedName = `${base}.${hash}${ext}`;

  renameSync(filePath, resolve(buildDir, hashedName));
  renames[asset] = hashedName;
}

const indexPath = resolve(buildDir, 'index.html');
let html = readFileSync(indexPath, 'utf8');

for (const [original, hashed] of Object.entries(renames)) {
  html = html.replaceAll(original, hashed);
}

writeFileSync(indexPath, html);

for (const [original, hashed] of Object.entries(renames)) {
  console.log(`${original} -> ${hashed}`);
}
