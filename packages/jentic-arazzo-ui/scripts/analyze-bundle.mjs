import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, '..');
const monorepoRoot = resolve(packageRoot, '../..');

const result = await build({
  configFile: false,
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  resolve: {
    alias: {
      'vscode-jsonrpc/lib/common/cancellation.js': resolve(monorepoRoot, 'node_modules/vscode-jsonrpc/lib/common/cancellation.js'),
      'vscode-jsonrpc/lib/common/events.js': resolve(monorepoRoot, 'node_modules/vscode-jsonrpc/lib/common/events.js'),
    },
  },
  logLevel: 'silent',
  build: {
    lib: {
      entry: resolve(packageRoot, 'src/ArazzoUIStandalone.umd.ts'),
      formats: ['umd'],
      name: 'ArazzoUIStandalone',
      fileName: () => 'analyze.js',
    },
    outDir: resolve(packageRoot, 'dist'),
    emptyOutDir: false,
    write: false,
    minify: false,
    cssCodeSplit: false,
    copyPublicDir: false,
  },
});

const output = result[0].output[0];
const modules = output.modules;

// Top 20 largest individual modules
const topModules = Object.entries(modules)
  .filter(([, m]) => m.renderedLength > 30000)
  .sort((a, b) => b[1].renderedLength - a[1].renderedLength)
  .slice(0, 25);

console.log('\nTop 25 largest modules (>30KB):');
console.log('─'.repeat(70));
for (const [id, mod] of topModules) {
  const short = id.includes('node_modules')
    ? id.replace(/.*node_modules\//, '')
    : id.replace(/.*packages\/jentic-arazzo-ui\//, '');
  console.log(`${(mod.renderedLength / 1024).toFixed(0).padStart(8)} KB  ${short}`);
}

// "other deps" breakdown
console.log('\n\n"other deps" breakdown:');
console.log('─'.repeat(70));
const otherGroups = {};
for (const [id, mod] of Object.entries(modules)) {
  if (mod.renderedLength === 0) continue;
  if (!id.includes('node_modules/')) continue;
  if (id.includes('@speclynx/apidom')) continue;
  if (id.includes('langium')) continue;
  if (id.includes('web-tree-sitter')) continue;
  if (id.includes('react-dom')) continue;
  if (id.includes('node_modules/react/') || id.includes('scheduler')) continue;
  if (id.includes('reactflow') || id.includes('@reactflow')) continue;
  if (id.includes('mermaid') || id.includes('dagre') || id.includes('/d3') || id.includes('elkjs')) continue;
  if (id.includes('vscode-jsonrpc')) continue;

  // Extract top-level package name
  const afterNm = id.replace(/.*node_modules\//, '');
  const pkg = afterNm.startsWith('@') ? afterNm.split('/').slice(0, 2).join('/') : afterNm.split('/')[0];
  otherGroups[pkg] = (otherGroups[pkg] || 0) + mod.renderedLength;
}

const sortedOther = Object.entries(otherGroups).sort((a, b) => b[1] - a[1]).slice(0, 20);
for (const [name, size] of sortedOther) {
  console.log(`${(size / 1024).toFixed(0).padStart(8)} KB  ${name}`);
}
