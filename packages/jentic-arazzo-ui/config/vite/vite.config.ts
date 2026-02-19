import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isEsm = process.env.BUILD_FORMAT === 'esm';
const packageRoot = resolve(__dirname, '../../');
const monorepoRoot = resolve(packageRoot, '../../');

// ESM: externalize all bare module imports (consumers resolve deps via their bundler)
// UMD: bundle everything into a single self-contained file
function isExternal(id: string) {
  if (!isEsm) return false;
  return !id.startsWith('.') && !id.startsWith('/');
}

export default defineConfig({
  plugins: [react()],
  resolve: isEsm
    ? undefined
    : {
        alias: {
          // langium imports vscode-jsonrpc subpaths not listed in its exports map
          'vscode-jsonrpc/lib/common/cancellation.js': resolve(
            monorepoRoot,
            'node_modules/vscode-jsonrpc/lib/common/cancellation.js',
          ),
          'vscode-jsonrpc/lib/common/events.js': resolve(
            monorepoRoot,
            'node_modules/vscode-jsonrpc/lib/common/events.js',
          ),
        },
      },
  build: {
    lib: {
      entry: resolve(packageRoot, 'src/index.ts'),
      ...(isEsm
        ? { formats: ['es'], fileName: () => 'arazzo-ui.mjs' }
        : { formats: ['umd'], name: 'jenticArazzoUi', fileName: () => 'arazzo-ui.js' }),
    },
    rollupOptions: {
      external: isExternal,
    },
    outDir: resolve(packageRoot, 'dist'),
    emptyOutDir: !isEsm, // only clean on first (UMD) build
    minify: !isEsm,
    cssCodeSplit: false,
    copyPublicDir: false,
  },
});
