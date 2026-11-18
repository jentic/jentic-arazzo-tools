// starts the Vite dev server: takes the viewer's own options out of the arguments, because
// `vite serve` rejects unknown options, and forwards everything else (--host, --port, ...) to it.
// Viewer options reach the dev page (public/main.tsx) through the environment, see vite.dev.config.ts
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const IGNORE_UNSUPPORTED_VERSION_FLAG = '--ignore-unsupported-version';

const args = process.argv.slice(2);
const viteArgs = args.filter((arg) => arg !== IGNORE_UNSUPPORTED_VERSION_FLAG);

const vitePackage = require.resolve('vite/package.json');
const viteBin = resolve(dirname(vitePackage), require(vitePackage).bin.vite);

const child = spawn(
  process.execPath,
  [viteBin, 'serve', '--config', 'config/vite/vite.dev.config.ts', ...viteArgs],
  {
    cwd: packageRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      ARAZZO_UI_IGNORE_UNSUPPORTED_VERSION: String(args.includes(IGNORE_UNSUPPORTED_VERSION_FLAG)),
    },
  },
);

// stop Vite along with this process, and exit with its status
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
