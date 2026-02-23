# CLAUDE.md

This file provides guidance for Claude Code when working with this repository.

## Project Overview

Jentic Arazzo Tools is a monorepo containing JavaScript packages for working with [Arazzo Specification](https://spec.openapis.org/arazzo/latest.html) documents. It uses [SpecLynx ApiDOM](https://github.com/speclynx/apidom) as the underlying data model.

## Repository Structure

```
jentic-arazzo-tools/
├── packages/
│   ├── jentic-arazzo-parser/    # @jentic/arazzo-parser package
│   ├── jentic-arazzo-resolver/  # @jentic/arazzo-resolver package
│   ├── jentic-arazzo-runner/    # @jentic/arazzo-runner package
│   ├── jentic-arazzo-ui/        # @jentic/arazzo-ui package
│   └── jentic-arazzo-validator/ # @jentic/arazzo-validator package
├── scripts/                      # Build and utility scripts
├── lerna.json                    # Lerna monorepo configuration
└── package.json                  # Root package.json
```

## Common Commands

**Important:** Always run `nvm use` before any npm commands to ensure the correct Node.js version is used.

```sh
# Use correct Node.js version (run this first!)
nvm use

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests for all packages
npm run test

# Lint code
npm run lint

# Format code
npm run prettier
```

## Package-specific Commands

From package directories (e.g., `packages/jentic-arazzo-parser`):

```sh
npm run build      # Build the package
npm run test       # Run tests
npm run lint       # Lint code
```

## Testing

- Tests use Mocha and Chai
- Test files are in `test/` directories with `.ts` extension
- Tests are transpiled to `.mjs` before running
- Snapshot testing uses `@speclynx/jest-snapshot-mocha-adapter`

## Code Conventions

- TypeScript with ES modules
- Babel for transpilation
- ESLint for linting
- Prettier for formatting
- Commit messages follow Conventional Commits
- Comments should start with lowercase letters

## @jentic/arazzo-ui

### Architecture

Two-tier component architecture:

- **ArazzoUI** — headless viewer component, controlled via `view` prop. Entry points: `src/ArazzoUI.tsx` (ESM), `src/ArazzoUI.umd.ts` (UMD imperative API)
- **ArazzoUIStandalone** — self-contained viewer with built-in header (logo, URL input, view mode toggle). Entry points: `src/ArazzoUIStandalone.tsx` (ESM), `src/ArazzoUIStandalone.umd.ts` (UMD imperative API)

UMD builds bundle all dependencies into a single file. ESM builds externalize all bare imports.

### UMD Imperative API

The UMD entry points expose a SwaggerUI-style imperative interface:

```js
ArazzoUIStandalone({ dom_id: '#root', document: 'https://example.com/workflow.arazzo.yaml' });
```

### Build Commands (from `packages/jentic-arazzo-ui`)

```sh
npm run build              # Build all formats (UMD + ESM + declarations)
npm run build:umd:ui       # UMD build of ArazzoUI
npm run build:umd:standalone  # UMD build of ArazzoUIStandalone
npm run build:esm:ui       # ESM build of ArazzoUI
npm run build:esm:standalone  # ESM build of ArazzoUIStandalone
npm run build:app          # Build deployable standalone app into build/
npm run dev                # Vite dev server
```

### Static App Build

`npm run build:app` produces a self-contained app in `build/`:
- `index.html` — loads UMD bundle + CSS, calls imperative API
- `arazzo-ui-standalone.js` — UMD bundle with all deps
- `arazzo-ui.css` — styles
- `petstore-order-workflow.arazzo.yaml` — sample fixture

Deployed to https://arazzo-ui.jentic.com via `gh-pages` branch.

### Vite Config Notes

- `config/vite/vite.config.ts` — main build config
- UMD builds define `process.env.NODE_ENV` as `'production'` (browsers don't have `process`)
- `config/vite/shims/empty.ts` — empty shim for Node.js builtins (`fs/promises`, `module`) imported by `web-tree-sitter`
- `vscode-jsonrpc` subpath aliases needed for langium compatibility
- Rollup `onwarn` suppresses `web-tree-sitter` eval warnings

### API Extractor

Two configs in `config/api-extractor/`:
- `api-extractor.ArazzoUI.json` — generates `types/arazzo-ui.d.ts`
- `api-extractor.ArazzoUIStandalone.json` — generates `types/arazzo-ui-standalone.d.ts`

All exported types must have `/** @public */` JSDoc tag. Both entry points re-export all public types to avoid `ae-forgotten-export` warnings. `@jentic` in JSDoc must be escaped as `\@jentic`.

### Cross-View Synchronization (Split View)

- Clicking a step node in the diagram pane expands the workflow and scrolls to that step in the docs pane
- Switching workflow tabs in the diagram scrolls to and expands the corresponding workflow in docs
- Uses `data-step-id` and `data-workflow-id` attributes on DOM elements for query targeting
- Shared state via `ArazzoViewerContext`: `selectedNodeId`, `activeWorkflowId`, `nodes`

### Bundle Analysis

```sh
node scripts/analyze-bundle.mjs
```

In-memory Vite UMD build (no files written), reports top 25 largest modules and "other deps" breakdown. Last known: apidom ~30%, mermaid+deps ~18%, other deps ~44%. Total: ~12 MB unminified → ~7 MB minified → ~1.7 MB gzipped.

## Key Dependencies

- `@speclynx/apidom-*` - SpecLynx ApiDOM packages for parsing and manipulating API specifications
- `mocha` / `chai` - Testing framework
- `lerna` - Monorepo management
