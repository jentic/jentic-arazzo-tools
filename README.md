# Jentic Arazzo Tools

A comprehensive JavaScript toolkit for parsing, resolving, validating, running and rendering [Arazzo Specification](https://spec.openapis.org/arazzo/latest.html) documents.

[![Discord](https://img.shields.io/badge/JOIN%20OUR%20DISCORD-COMMUNITY-7289DA?style=plastic&logo=discord&logoColor=white)](https://discord.gg/yrxmDZWMqB)
[![Build Status](https://github.com/jentic/jentic-arazzo-tools/actions/workflows/build.yml/badge.svg)](https://github.com/jentic/jentic-arazzo-tools/actions)
[![Dependabot enabled](https://badgen.net/badge/icon/dependabot?icon=dependabot&label)](https://docs.github.com/en/code-security/supply-chain-security/keeping-your-dependencies-updated-automatically)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-3.0-40c463.svg)](https://github.com/jentic/jentic-arazzo-tools/blob/HEAD/CODE_OF_CONDUCT.md)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/jentic/jentic-arazzo-tools/blob/HEAD/LICENSE)

**Supported Arazzo versions:**
- [Arazzo 1.0.0](https://spec.openapis.org/arazzo/v1.0.0)
- [Arazzo 1.0.1](https://spec.openapis.org/arazzo/v1.0.1)

**Supported OpenAPI versions (for source descriptions):**
- [OpenAPI 2.0](https://spec.openapis.org/oas/v2.0)
- [OpenAPI 3.0.x](https://spec.openapis.org/oas/v3.0.4)
- [OpenAPI 3.1.x](https://spec.openapis.org/oas/v3.1.2)

## Packages

This monorepo contains the following packages:

| Package | Description |
|---------|-------------|
| [@jentic/arazzo-parser](./packages/jentic-arazzo-parser) | Parser for Arazzo Documents producing [SpecLynx ApiDOM](https://github.com/speclynx/apidom) data model |
| [@jentic/arazzo-resolver](./packages/jentic-arazzo-resolver) | Resolver for Arazzo Documents |
| [@jentic/arazzo-validator](./packages/jentic-arazzo-validator) | Validator & Linter for Arazzo Documents |
| [@jentic/arazzo-runner](./packages/jentic-arazzo-runner) | Runner for Arazzo Workflows |
| [@jentic/arazzo-ui](./packages/jentic-arazzo-ui) | UI for Arazzo Workflows |

---

## Parser

The Parser parses Arazzo Documents from various sources and produces a [SpecLynx ApiDOM](https://github.com/speclynx/apidom) data model using the [Arazzo 1.x namespace](https://github.com/speclynx/apidom/tree/main/packages/apidom-ns-arazzo-1#readme).

```sh
npm install @jentic/arazzo-parser
```

```js
import { parse } from '@jentic/arazzo-parser';

// Parse from object
const parseResult = await parse({
  arazzo: '1.0.1',
  info: { title: 'My Workflow', version: '1.0.0' },
  sourceDescriptions: [{ name: 'api', type: 'openapi', url: 'https://example.com/openapi.json' }],
  workflows: [],
});

// Parse from JSON/YAML string
const parseResult = await parse('{"arazzo": "1.0.1", ...}');

// Parse from file
const parseResult = await parse('/path/to/arazzo.json');

// Parse from URL
const parseResult = await parse('https://example.com/arazzo.yaml');

// Access the parsed Arazzo specification
const arazzoSpec = parseResult.api;
```

For complete documentation, see the [@jentic/arazzo-parser README](./packages/jentic-arazzo-parser/README.md).

---

## Resolver

The Resolver dereferences Arazzo and OpenAPI Documents, resolving all references inline to produce self-contained [SpecLynx ApiDOM](https://github.com/speclynx/apidom) data models.

```sh
npm install @jentic/arazzo-resolver
```

```js
import { dereferenceArazzo, dereferenceOpenAPI } from '@jentic/arazzo-resolver';

// Dereference Arazzo from file or URL
const arazzoResult = await dereferenceArazzo('/path/to/arazzo.json');
const arazzoSpec = arazzoResult.api; // All references resolved inline

// Dereference with source descriptions
const resultWithSources = await dereferenceArazzo('/path/to/arazzo.json', {
  dereference: { strategyOpts: { sourceDescriptions: true } },
});

// Dereference OpenAPI from file or URL
const openapiResult = await dereferenceOpenAPI('/path/to/openapi.json');
const openapiSpec = openapiResult.api; // All $ref references resolved inline
```

For complete documentation, see the [@jentic/arazzo-resolver README](./packages/jentic-arazzo-resolver/README.md).

---

## Validator

The Validator validates and lints Arazzo Documents against JSON Schema and performs semantic validation using [SpecLynx ApiDOM Language Service](https://www.npmjs.com/package/@speclynx/apidom-ls).

### CLI

Validate Arazzo documents from the command line:

```sh
npx @jentic/arazzo-validator arazzo.yaml
```

```text
arazzo.yaml
  1:1  error  json-schema  Object must have required property "sourceDescriptions"
  2:1  error  json-schema  "info" property must have required property "version"

✖ 2 problems (2 errors, 0 warnings)
```

Multiple output formats available: `stylish` (default), `codeframe`, `json`, `github-actions`.

### Programmatic API

```sh
npm install @jentic/arazzo-validator
```

```js
import { validateURI, DiagnosticSeverity } from '@jentic/arazzo-validator';

const diagnostics = await validateURI('/path/to/arazzo.yaml');
const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
```

For complete documentation, see the [@jentic/arazzo-validator README](./packages/jentic-arazzo-validator/README.md).

---

## UI

Interactive viewer for Arazzo workflows with diagram, documentation, and split views.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-arazzo--ui.jentic.com-blue?style=for-the-badge)](https://arazzo-ui.jentic.com)

```sh
npm install @jentic/arazzo-ui
```

```jsx
import { ArazzoUI } from '@jentic/arazzo-ui';
import '@jentic/arazzo-ui/styles.css';

<ArazzoUI document="https://example.com/workflow.arazzo.yaml" view="split" />
```

Also available as a self-contained widget with built-in header and view controls:

```jsx
import { ArazzoUIStandalone } from '@jentic/arazzo-ui/standalone';
import '@jentic/arazzo-ui/styles.css';

<ArazzoUIStandalone document="https://example.com/workflow.arazzo.yaml" />
```

For complete documentation, see the [@jentic/arazzo-ui README](./packages/jentic-arazzo-ui/README.md).

---

## Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) before submitting a pull request.

## License

This project is licensed under the [Apache 2.0 License](./LICENSE).
