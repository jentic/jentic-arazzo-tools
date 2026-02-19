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

## Key Dependencies

- `@speclynx/apidom-*` - SpecLynx ApiDOM packages for parsing and manipulating API specifications
- `mocha` / `chai` - Testing framework
- `lerna` - Monorepo management
