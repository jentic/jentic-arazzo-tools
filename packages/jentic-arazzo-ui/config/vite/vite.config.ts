import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isEsm = process.env.BUILD_FORMAT === 'esm';
const entry = process.env.BUILD_ENTRY || 'ArazzoUI';
const packageRoot = resolve(__dirname, '../../');
const monorepoRoot = resolve(packageRoot, '../../');

const entries: Record<string, { esm: string; umd: string; umdName: string; fileName: string }> = {
  ArazzoUI: {
    esm: resolve(packageRoot, 'src/ArazzoUI.tsx'),
    umd: resolve(packageRoot, 'src/ArazzoUI.umd.ts'),
    umdName: 'ArazzoUI',
    fileName: 'arazzo-ui',
  },
  ArazzoUIStandalone: {
    esm: resolve(packageRoot, 'src/ArazzoUIStandalone.tsx'),
    umd: resolve(packageRoot, 'src/ArazzoUIStandalone.umd.ts'),
    umdName: 'ArazzoUIStandalone',
    fileName: 'arazzo-ui-standalone',
  },
};

const current = entries[entry];
if (!current) {
  throw new Error(`Unknown BUILD_ENTRY: ${entry}. Expected one of: ${Object.keys(entries).join(', ')}`);
}

// ESM: externalize all bare module imports (consumers resolve deps via their bundler)
// UMD: bundle everything into a single self-contained file
function isExternal(id: string) {
  if (!isEsm) return false;
  return !id.startsWith('.') && !id.startsWith('/');
}

export default defineConfig({
  define: isEsm ? {} : { 'process.env.NODE_ENV': JSON.stringify('production') },
  plugins: [react()],
  resolve: isEsm
    ? undefined
    : {
        alias: {
          // web-tree-sitter imports Node.js builtins that don't exist in the browser;
          // provide explicit empty shims so Vite doesn't auto-externalize with warnings
          'fs/promises': resolve(packageRoot, 'config/vite/shims/empty.ts'),
          module: resolve(packageRoot, 'config/vite/shims/empty.ts'),
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
      entry: isEsm ? current.esm : current.umd,
      ...(isEsm
        ? { formats: ['es'], fileName: () => `${current.fileName}.mjs` }
        : { formats: ['umd'], name: current.umdName, fileName: () => `${current.fileName}.js` }),
    },
    rollupOptions: {
      external: isExternal,
      onwarn(warning, warn) {
        // suppress web-tree-sitter warnings (Node.js builtins + eval usage)
        if (warning.id?.includes('web-tree-sitter')) return;
        warn(warning);
      },
    },
    outDir: resolve(packageRoot, 'dist'),
    emptyOutDir: false,
    minify: !isEsm,
    cssCodeSplit: false,
    copyPublicDir: false,
  },
});
