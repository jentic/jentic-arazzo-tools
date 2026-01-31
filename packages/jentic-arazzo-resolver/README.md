# @jentic/arazzo-resolver

`@jentic/arazzo-resolver` is a resolver for [Arazzo Specification](https://spec.openapis.org/arazzo/latest.html) documents.
It produces [SpecLynx ApiDOM](https://github.com/speclynx/apidom) data model using the [Arazzo 1.x namespace](https://github.com/speclynx/apidom/tree/main/packages/apidom-ns-arazzo-1#readme).

## What is dereferencing?

Dereferencing is the process of replacing references with the actual content they point to. In Arazzo Documents, this includes:

- **JSON Schemas** - resolves all referencing mechanisms (`$ref`, `$anchor`, etc.) within schemas
- **Reusable Object references** (`$components.*`) - references to reusable components like inputs, parameters, and success actions

After dereferencing, all references are resolved inline, making the document self-contained and easier to process programmatically.

**Current limitation:** The resolver only processes the entry Arazzo Document. Referenced OpenAPI/AsyncAPI source descriptions are not resolved.

## Installation

You can install this package via [npm](https://npmjs.org/) CLI by running the following command:

```sh
npm install @jentic/arazzo-resolver
```

## Usage

`@jentic/arazzo-resolver` provides two main functions for dereferencing Arazzo Documents:

1. **`dereference(uri)`** - Dereferences from a file system path or HTTP(S) URL
2. **`dereferenceElement(element)`** - Dereferences an ApiDOM element

### Dereferencing from file

```js
import { dereference } from '@jentic/arazzo-resolver';

const parseResult = await dereference('/path/to/arazzo.json');
// parseResult is ParseResultElement with all references resolved
```

### Dereferencing from URL

```js
import { dereference } from '@jentic/arazzo-resolver';

const parseResult = await dereference('https://example.com/arazzo.yaml');
```

### Dereferencing an ApiDOM element

When you already have a parsed Arazzo Document (e.g., from `@jentic/arazzo-parser`), you can dereference the element directly:

```js
import { parse } from '@jentic/arazzo-parser';
import { dereferenceElement } from '@jentic/arazzo-resolver';

// Parse first, then dereference
const parseResult = await parse('/path/to/arazzo.json');
const dereferenced = await dereferenceElement(parseResult);
```

#### Dereferencing elements without retrievalURI

When dereferencing a ParseResultElement that was parsed from inline content (string or object), you must provide a `baseURI`:

```js
import { parse } from '@jentic/arazzo-parser';
import { dereferenceElement } from '@jentic/arazzo-resolver';

const parseResult = await parse({ arazzo: '1.0.1', ... });
const dereferenced = await dereferenceElement(parseResult, {
  resolve: { baseURI: 'https://example.com/arazzo.json' },
});
```

#### Dereferencing child elements

You can dereference individual child elements (e.g., a specific workflow) by providing the parent parseResult in options:

```js
import { parse } from '@jentic/arazzo-parser';
import { dereferenceElement } from '@jentic/arazzo-resolver';

const parseResult = await parse('/path/to/arazzo.json');
const workflow = parseResult.api.workflows.get(0);

const dereferencedWorkflow = await dereferenceElement(workflow, {
  dereference: { strategyOpts: { parseResult } },
});
```

## Dereference options

Both `dereference` and `dereferenceElement` functions accept an optional options argument compatible with [SpecLynx ApiDOM Reference Options](https://github.com/speclynx/apidom/blob/main/packages/apidom-reference/src/options/index.ts):

```js
import { dereference } from '@jentic/arazzo-resolver';

const parseResult = await dereference('/path/to/arazzo.json', {
  resolve: {
    baseURI: 'https://example.com/',  // Base URI for relative references
  },
  parse: {
    parserOpts: {
      sourceMap: true,  // Include source maps in parsed documents
    },
  },
});
```

### Default options

You can import and inspect the default options:

```js
import { defaultDereferenceOptions } from '@jentic/arazzo-resolver';

console.log(defaultDereferenceOptions);
// {
//   resolve: {
//     resolvers: [FileResolver, HTTPResolverAxios],
//   },
//   parse: {
//     mediaType: 'application/vnd.oai.arazzo;version=1.0.1',
//     parsers: [ArazzoJSON1Parser, ArazzoYAML1Parser, JSONParser, YAMLParser, BinaryParser],
//   },
//   dereference: {
//     strategies: [Arazzo1, OpenAPI2, OpenAPI3_0, OpenAPI3_1],
//   },
// }
```

## Error handling

When dereferencing fails, a `DereferenceError` is thrown. The original error is available via the `cause` property:

```js
import { dereference, DereferenceError } from '@jentic/arazzo-resolver';

try {
  await dereference('/path/to/arazzo.json');
} catch (error) {
  if (error instanceof DereferenceError) {
    console.error(error.message);  // 'Failed to dereference Arazzo Document at "/path/to/arazzo.json"'
    console.error(error.cause);    // Original error from underlying resolver
  }
}
```

## Working with the result

The `dereference` function returns a [ParseResultElement](https://github.com/speclynx/apidom/blob/main/packages/apidom-datamodel/README.md#parseresultelement) with all references resolved inline.

```js
import { dereference } from '@jentic/arazzo-resolver';

const parseResult = await dereference('/path/to/arazzo.json');

// Access the main Arazzo specification element
const arazzoSpec = parseResult.api;

// Check if parsing produced any errors
const hasErrors = parseResult.errors.length > 0;

// Check if parseResult is empty
const isEmpty = parseResult.isEmpty;

// All references are now resolved inline
const firstWorkflow = arazzoSpec.workflows.get(0);
const firstStep = firstWorkflow.steps.get(0);
```

### Retrieval URI metadata

The `dereference` function automatically sets `retrievalURI` metadata on the parse result:

```js
import { dereference } from '@jentic/arazzo-resolver';
import { toValue } from '@speclynx/apidom-core';

const parseResult = await dereference('https://example.com/arazzo.yaml');

const uri = toValue(parseResult.meta.get('retrievalURI'));
// 'https://example.com/arazzo.yaml'
```

Note: `dereferenceElement` does not set `retrievalURI` - it preserves whatever metadata was on the original element.

## Function aliases

For consistency with future OpenAPI/AsyncAPI support, the following aliases are available:

| Function | Alias |
|----------|-------|
| `dereference` | `dereferenceArazzo` |
| `dereferenceElement` | `dereferenceArazzoElement` |
| `defaultDereferenceOptions` | `defaultDereferenceArazzoOptions` |

## SpecLynx ApiDOM tooling

Since `@jentic/arazzo-resolver` produces a SpecLynx ApiDOM data model, you have access to the full suite of ApiDOM tools for manipulating, traversing, and transforming the dereferenced document.

### Core utilities

The [@speclynx/apidom-core](https://github.com/speclynx/apidom/tree/main/packages/apidom-core) package provides essential utilities for working with ApiDOM elements. Here are just a few examples:

```js
import { dereference } from '@jentic/arazzo-resolver';
import { cloneDeep, cloneShallow } from '@speclynx/apidom-datamodel';
import { toValue, toJSON, toYAML, sexprs } from '@speclynx/apidom-core';

const parseResult = await dereference('/path/to/arazzo.json');
const arazzoSpec = parseResult.api;

// Convert to plain JavaScript object
const obj = toValue(arazzoSpec);

// Serialize to JSON string
const json = toJSON(arazzoSpec);

// Serialize to YAML string
const yaml = toYAML(arazzoSpec);

// Clone the element
const clonedShallow = cloneShallow(arazzoSpec);
const clonedDeep = cloneDeep(arazzoSpec);

// Get S-expression representation (useful for debugging)
const sexpr = sexprs(arazzoSpec);
```

### Traversal

The [@speclynx/apidom-traverse](https://github.com/speclynx/apidom/tree/main/packages/apidom-traverse) package provides powerful traversal capabilities. Here is a basic example:

```js
import { dereference } from '@jentic/arazzo-resolver';
import { traverse } from '@speclynx/apidom-traverse';

const parseResult = await dereference('/path/to/arazzo.json');

// Traverse and collect steps using semantic visitor hook
const steps = [];
traverse(parseResult.api, {
  StepElement(path) {
    steps.push(path.node);
    if (steps.length >= 10) {
      path.stop(); // Stop traversal after collecting 10 steps
    }
  },
});
```

For more information about available utilities, see the [SpecLynx ApiDOM documentation](https://github.com/speclynx/apidom).
