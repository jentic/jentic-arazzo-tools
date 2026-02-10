# @jentic/arazzo-validator

`@jentic/arazzo-validator` is a validator and linter for [Arazzo Specification](https://spec.openapis.org/arazzo/latest.html) documents.
It validates documents against JSON Schema and performs semantic validation using [SpecLynx ApiDOM Language Service](https://www.npmjs.com/package/@speclynx/apidom-ls).

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

// Check for errors
const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
if (errors.length > 0) {
  console.error('Validation errors:', errors);
}
```

### From URL

```js
import { validateURI } from '@jentic/arazzo-validator';

const diagnostics = await validateURI('https://example.com/arazzo.yaml');
```

### From TextDocument

When you already have document content in memory, use the lower-level `validate` function:

```js
import { validate, TextDocument } from '@jentic/arazzo-validator';

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

const textDocument = TextDocument.create(
  'file:///path/to/arazzo.yaml',
  'arazzo',
  1,
  content
);
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

// Default resolve options (from @jentic/arazzo-parser)
console.log(defaultArazzoResolveOptions);
// {
//   resolvers: [MemoryResolver, FileResolver, HTTPResolverAxios],
//   resolverOpts: {},
// }

// Default language service context
console.log(defaultLanguageServiceContext);
// {
//   metadata: {...},
//   defaultContentLanguage: {
//     namespace: 'arazzo',
//     version: '1.0.1',
//     mediaType: 'application/vnd.oai.workflows;version=1.0.1',
//   },
//   validatorProviders: [Arazzo1JsonSchemaValidationProvider],
//   validationContext: {
//     jsonSchemaValidation: true,
//     semanticValidation: true,
//     referenceValidation: false,
//     semanticLinting: true,
//     betterAjvErrors: true,
//   },
//   parseContext: {
//     fileAllowList: ['*'],
//     arazzo: { sourceDescriptionsResolution: true },
//   },
// }
```

## Working with diagnostics

Both validation functions return an array of [Diagnostic](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#diagnostic) objects compatible with VS Code and the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/).

```js
import { validateURI, DiagnosticSeverity } from '@jentic/arazzo-validator';

const diagnostics = await validateURI('/path/to/arazzo.yaml');

for (const diagnostic of diagnostics) {
  // DiagnosticSeverity.Error = 1
  // DiagnosticSeverity.Warning = 2
  // DiagnosticSeverity.Information = 3
  // DiagnosticSeverity.Hint = 4

  // Position in the document
  const { start, end } = diagnostic.range;

  if (diagnostic.severity === DiagnosticSeverity.Error) {
    console.error(
      `Error at line ${start.line + 1}, column ${start.character + 1}: ${diagnostic.message}`
    );
  }
}
```

### Filtering by severity

```js
import { validateURI, DiagnosticSeverity } from '@jentic/arazzo-validator';

const diagnostics = await validateURI('/path/to/arazzo.yaml');

// Get only errors
const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);

// Get only warnings
const warnings = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Warning);

// Check if document is valid
const isValid = errors.length === 0;
```

## Validation types

The validator performs several types of validation:

### JSON Schema validation

Validates the document structure against the Arazzo JSON Schema. This catches structural issues like:
- Missing required fields
- Invalid field types
- Unknown properties

### Semantic validation

Validates Arazzo-specific semantics beyond JSON Schema, such as:
- Valid workflow references
- Correct step dependencies
- Proper expression syntax

### Semantic linting

Applies linting rules for best practices and potential issues:
- Duplicate keys detection
- Naming conventions
- Potential logical errors
