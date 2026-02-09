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

## Packages

This monorepo contains the following packages:

| Package | Description |
|---------|-------------|
| [@jentic/arazzo-parser](./packages/jentic-arazzo-parser) | Parser for Arazzo Documents producing [SpecLynx ApiDOM](https://github.com/speclynx/apidom) data model |
| [@jentic/arazzo-resolver](./packages/jentic-arazzo-resolver) | Resolver for Arazzo Documents |

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

## Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) before submitting a pull request.

## License

This project is licensed under the [Apache 2.0 License](./LICENSE).
