// starts the Vite dev server; `vite serve` rejects unknown options, so viewer options are parsed
// here and handed to the dev page (public/main.tsx) as compile-time constants
import { createServer } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, '..');

const IGNORE_UNSUPPORTED_VERSION_FLAG = '--ignore-unsupported-version';

const args = process.argv.slice(2);
const unknownOptions = args.filter((arg) => arg !== IGNORE_UNSUPPORTED_VERSION_FLAG);

if (unknownOptions.length > 0) {
  console.error(`Unknown option: ${unknownOptions.join(', ')}`);
  console.error(`Usage: npm run dev -- [${IGNORE_UNSUPPORTED_VERSION_FLAG}]`);
  process.exit(1);
}

const server = await createServer({
  configFile: resolve(packageRoot, 'config/vite/vite.dev.config.ts'),
  define: {
    __ARAZZO_UI_IGNORE_UNSUPPORTED_VERSION__: JSON.stringify(
      args.includes(IGNORE_UNSUPPORTED_VERSION_FLAG),
    ),
  },
});

await server.listen();
server.printUrls();
server.bindCLIShortcuts({ print: true });
