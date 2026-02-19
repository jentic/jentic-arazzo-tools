import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const packageRoot = resolve(__dirname, '../../');
const monorepoRoot = resolve(packageRoot, '../../');

export default defineConfig({
  root: resolve(packageRoot, 'public'),
  plugins: [react()],
  resolve: {
    alias: {
      '@jentic/arazzo-ui': resolve(packageRoot, 'src/index.ts'),
      // langium imports vscode-jsonrpc subpaths not listed in its exports map
      'vscode-jsonrpc/lib/common/cancellation.js': resolve(monorepoRoot, 'node_modules/vscode-jsonrpc/lib/common/cancellation.js'),
      'vscode-jsonrpc/lib/common/events.js': resolve(monorepoRoot, 'node_modules/vscode-jsonrpc/lib/common/events.js'),
    },
  },
  optimizeDeps: {
    include: ['mermaid', 'dayjs', 'react', 'react-dom', 'reactflow'],
  },
  server: {
    port: 3000,
    open: true,
  },
});
