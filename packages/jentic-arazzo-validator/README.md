# @jentic/arazzo-validator

`@jentic/arazzo-validator` is a validator and linter for [Arazzo Specification](https://spec.openapis.org/arazzo/latest.html) documents.
It performs JSON Schema validation, semantic validation, and semantic linting using [SpecLynx ApiDOM Language Service](https://www.npmjs.com/package/@speclynx/apidom-ls).

**Supported Arazzo versions:**
- [Arazzo 1.0.0](https://spec.openapis.org/arazzo/v1.0.0)
- [Arazzo 1.0.1](https://spec.openapis.org/arazzo/v1.0.1)

## Installation

You can install this package via [npm](https://npmjs.org/) CLI by running the following command:

```sh
npm install @jentic/arazzo-validator
```

## Usage

`@jentic/arazzo-validator` provides two validation functions:

- **`validateURI`** - Primary API for validating Arazzo documents from file paths or URLs
- **`validate`** - Lower-level API for using [`TextDocument`](https://www.npmjs.com/package/vscode-languageserver-textdocument)

## Validating Arazzo Documents

### From file

```js
import { validateURI, DiagnosticSeverity } from '@jentic/arazzo-validator';

const diagnostics = await validateURI('/path/to/arazzo.yaml');
```

### From URL

```js
import { validateURI } from '@jentic/arazzo-validator';

const diagnostics = await validateURI('https://example.com/arazzo.yaml');
```

### From TextDocument

When you already have document content in memory, use the lower-level `validate` function with `createTextDocument`:

```js
import { validate, createTextDocument } from '@jentic/arazzo-validator';

const content = `
arazzo: '1.0.1'
info:
  title: My Workflow
  version: '1.0.0'
sourceDescriptions:
  - name: myApi
    type: openapi
    url: https://example.com/openapi.json
workflows:
  - workflowId: myWorkflow
    steps:
      - stepId: step1
        operationId: myApi.getUsers
`;

const textDocument = createTextDocument('file:///path/to/arazzo.yaml', content);
const diagnostics = await validate(textDocument);
```

Alternatively, use `TextDocument.create()` directly for full control:

```js
import { validate, TextDocument } from '@jentic/arazzo-validator';

const textDocument = TextDocument.create('file:///path/to/arazzo.yaml', 'apidom', 1, content);
const diagnostics = await validate(textDocument);
```

## Validation options

### Customizing language service context

The `validateURI` and `validate` functions accept an optional context parameter to customize validation behavior:

```js
import { validateURI } from '@jentic/arazzo-validator';

const diagnostics = await validateURI('/path/to/arazzo.yaml', {
  validationContext: {
    jsonSchemaValidation: true,   // Validate against JSON Schema (default: true)
    semanticValidation: true,     // Perform semantic validation (default: true)
    referenceValidation: false,   // Validate references (default: false)
    semanticLinting: true,        // Apply linting rules (default: true)
    betterAjvErrors: true,        // Use improved error messages (default: true)
  },
  parseContext: {
    fileAllowList: ['*'],         // Glob patterns for allowed files (default: ['*'])
    arazzo: {
      sourceDescriptionsResolution: true, // Resolve source descriptions (default: true)
    },
  },
});
```

### Customizing URI resolution

The `validateURI` function accepts an optional third parameter for customizing how the URI is resolved. The shape of these options is defined by [SpecLynx ApiDOM Reference Resolve Options](https://github.com/speclynx/apidom/blob/main/packages/apidom-reference/src/options/index.ts):

```js
import { validateURI } from '@jentic/arazzo-validator';

const diagnostics = await validateURI('https://example.com/arazzo.yaml', {}, {
  resolverOpts: {
    timeout: 10000, // HTTP timeout in milliseconds
  },
});
```

### Security considerations

By default, `fileAllowList` is set to `['*']` which allows the validator to access any file on the filesystem when resolving source descriptions. Additionally, `sourceDescriptionsResolution` is enabled by default, which means the validator will fetch and parse external documents referenced in the Arazzo document.

When validating untrusted documents, consider restricting file access:

```js
const diagnostics = await validateURI('/path/to/arazzo.yaml', {
  parseContext: {
    fileAllowList: [],  // Disable file access
    arazzo: {
      sourceDescriptionsResolution: false, // Disable source description resolution
    },
  },
});
```

## Default options

You can import the default options to inspect or extend them:

```js
import {
  defaultArazzoResolveOptions,
  defaultLanguageServiceContext,
} from '@jentic/arazzo-validator';
```

- `defaultArazzoResolveOptions` - file and HTTP resolvers configuration
- `defaultLanguageServiceContext` - validation settings (JSON Schema, semantic validation, linting)

## Working with diagnostics

Both validation functions return an array of [Diagnostic](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#diagnostic) objects compatible with VS Code and the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/).

```js
import { validateURI, DiagnosticSeverity } from '@jentic/arazzo-validator';

const diagnostics = await validateURI('/path/to/arazzo.yaml');
const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
const warnings = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Warning);
const isValid = errors.length === 0;
```