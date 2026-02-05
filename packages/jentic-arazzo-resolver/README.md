# @jentic/arazzo-resolver

`@jentic/arazzo-resolver` is a resolver for [Arazzo Specification](https://spec.openapis.org/arazzo/latest.html) and [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) documents.
It produces [SpecLynx ApiDOM](https://github.com/speclynx/apidom) data models using the appropriate namespace ([Arazzo 1.x](https://github.com/speclynx/apidom/tree/main/packages/apidom-ns-arazzo-1#readme), [OpenAPI 2.0](https://github.com/speclynx/apidom/tree/main/packages/apidom-ns-openapi-2#readme), [OpenAPI 3.0.x](https://github.com/speclynx/apidom/tree/main/packages/apidom-ns-openapi-3-0#readme), [OpenAPI 3.1.x](https://github.com/speclynx/apidom/tree/main/packages/apidom-ns-openapi-3-1#readme)).

## Installation

You can install this package via [npm](https://npmjs.org/) CLI by running the following command:

```sh
npm install @jentic/arazzo-resolver
```

## Dereferencing

Dereferencing is the process of replacing references with the actual content they point to.

**In Arazzo Documents**, this includes:

- **JSON Schemas** - resolves references within schemas
- **Reusable Object references** (`$components.*`) - references to reusable components like parameters and actions

**In OpenAPI Documents**, this includes:

- **Reference Objects** (`$ref`) - resolves references to components, external files, and URLs
- **JSON Schemas** - resolves references within schemas
- **Path Item Object** - resolves references to path items
- and others

After dereferencing, all references are resolved inline, making the document self-contained and easier to process programmatically.

**Current limitation:** The Arazzo resolver only processes the entry Arazzo Document. Referenced OpenAPI/Arazzo source descriptions are not resolved.

### Functions

**Arazzo:**
- **`dereferenceArazzo(uri)`** - Dereferences from a file system path or HTTP(S) URL
- **`dereferenceArazzoElement(element)`** - Dereferences a SpecLynx ApiDOM element

**OpenAPI:**
- **`dereferenceOpenAPI(uri)`** - Dereferences from a file system path or HTTP(S) URL
- **`dereferenceOpenAPIElement(element)`** - Dereferences a SpecLynx ApiDOM element

### Arazzo Documents

#### From file

```js
import { dereferenceArazzo } from '@jentic/arazzo-resolver';

const parseResult = await dereferenceArazzo('/path/to/arazzo.json');
// parseResult is ParseResultElement with all references resolved
```

#### From URL

```js
import { dereferenceArazzo } from '@jentic/arazzo-resolver';

const parseResult = await dereferenceArazzo('https://example.com/arazzo.yaml');
```

#### From ApiDOM element

When you already have a parsed Arazzo Document (e.g., from `@jentic/arazzo-parser`), you can dereference the element directly:

```js
import { parseArazzo } from '@jentic/arazzo-parser';
import { dereferenceArazzoElement } from '@jentic/arazzo-resolver';

// Parse first, then dereference
const parseResult = await parseArazzo('/path/to/arazzo.json');
const dereferenced = await dereferenceArazzoElement(parseResult);
```

##### Without retrievalURI

When dereferencing a ParseResultElement that was parsed from inline content (string or object), you must provide a `baseURI`:

```js
import { parseArazzo } from '@jentic/arazzo-parser';
import { dereferenceArazzoElement } from '@jentic/arazzo-resolver';

const parseResult = await parseArazzo({ arazzo: '1.0.1', ... });
const dereferenced = await dereferenceArazzoElement(parseResult, {
  resolve: { baseURI: 'https://example.com/arazzo.json' },
});
```

##### Child elements

You can dereference individual child elements (e.g., a specific workflow) by providing the parent parseResult in options:

```js
import { parseArazzo } from '@jentic/arazzo-parser';
import { dereferenceArazzoElement } from '@jentic/arazzo-resolver';

const parseResult = await parseArazzo('/path/to/arazzo.json');
const workflow = parseResult.api.workflows.get(0);

const dereferencedWorkflow = await dereferenceArazzoElement(workflow, {
  dereference: { strategyOpts: { parseResult } },
});
```

### OpenAPI Documents

Supports [OpenAPI 2.0 (Swagger)](https://spec.openapis.org/oas/v2.0), [OpenAPI 3.0.x](https://spec.openapis.org/oas/v3.0.4), and [OpenAPI 3.1.x](https://spec.openapis.org/oas/v3.1.2).

#### From file

```js
import { dereferenceOpenAPI } from '@jentic/arazzo-resolver';

const parseResult = await dereferenceOpenAPI('/path/to/openapi.json');
// parseResult is ParseResultElement with all references resolved
```

#### From URL

```js
import { dereferenceOpenAPI } from '@jentic/arazzo-resolver';

const parseResult = await dereferenceOpenAPI('https://example.com/openapi.yaml');
```

#### From ApiDOM element

When you already have a parsed OpenAPI Document (e.g., from `@jentic/arazzo-parser`), you can dereference the element directly:

```js
import { parseOpenAPI } from '@jentic/arazzo-parser';
import { dereferenceOpenAPIElement } from '@jentic/arazzo-resolver';

// Parse first, then dereference
const parseResult = await parseOpenAPI('/path/to/openapi.json');
const dereferenced = await dereferenceOpenAPIElement(parseResult);
```

##### Without retrievalURI

When dereferencing a ParseResultElement that was parsed from inline content (string or object), you must provide a `baseURI`:

```js
import { parseOpenAPI } from '@jentic/arazzo-parser';
import { dereferenceOpenAPIElement } from '@jentic/arazzo-resolver';

const parseResult = await parseOpenAPI({ openapi: '3.1.0', ... });
const dereferenced = await dereferenceOpenAPIElement(parseResult, {
  resolve: { baseURI: 'https://example.com/openapi.json' },
});
```

##### Child elements

You can dereference individual child elements (e.g., a specific Operation Object) by providing the parent parseResult in options:

```js
import { parseOpenAPI } from '@jentic/arazzo-parser';
import { dereferenceOpenAPIElement } from '@jentic/arazzo-resolver';

const parseResult = await parseOpenAPI('/path/to/openapi.json');
const operation = parseResult.api.paths.get('/users').get;

const dereferencedOperation = await dereferenceOpenAPIElement(operation, {
  dereference: { strategyOpts: { parseResult } },
});
```

### Options

All dereference functions accept an optional options argument compatible with [SpecLynx ApiDOM Reference Options](https://github.com/speclynx/apidom/blob/main/packages/apidom-reference/src/options/index.ts):

```js
import { dereferenceArazzo } from '@jentic/arazzo-resolver';

const parseResult = await dereferenceArazzo('/path/to/arazzo.json', {
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

#### Default options

You can import and inspect the default options:

```js
import {
  defaultDereferenceArazzoOptions,
  defaultDereferenceOpenAPIOptions,
} from '@jentic/arazzo-resolver';

console.log(defaultDereferenceArazzoOptions);
// {
//   resolve: {
//     resolvers: [FileResolver, HTTPResolverAxios],
//   },
//   parse: {
//     parsers: [ArazzoJSON1Parser, ArazzoYAML1Parser, JSONParser, YAMLParser, BinaryParser],
//   },
//   dereference: {
//     strategies: [Arazzo1DereferenceStrategy],
//   },
// }

console.log(defaultDereferenceOpenAPIOptions);
// {
//   resolve: {
//     resolvers: [FileResolver, HTTPResolverAxios],
//   },
//   parse: {
//     parsers: [
//       OpenApiJSON2Parser, OpenApiYAML2Parser,
//       OpenApiJSON3_0Parser, OpenApiYAML3_0Parser,
//       OpenApiJSON3_1Parser, OpenApiYAML3_1Parser,
//       JSONParser, YAMLParser, BinaryParser
//     ],
//   },
//   dereference: {
//     strategies: [OpenAPI2DereferenceStrategy, OpenAPI3_0DereferenceStrategy, OpenAPI3_1DereferenceStrategy],
//   },
// }
```

### Error handling

When dereferencing fails, a `DereferenceError` is thrown. The original error is available via the `cause` property:

```js
import { dereferenceArazzo, dereferenceOpenAPI, DereferenceError } from '@jentic/arazzo-resolver';

try {
  await dereferenceArazzo('/path/to/arazzo.json');
} catch (error) {
  if (error instanceof DereferenceError) {
    console.error(error.message);  // 'Failed to dereference Arazzo Document at "/path/to/arazzo.json"'
    console.error(error.cause);    // Original error from underlying resolver
  }
}

try {
  await dereferenceOpenAPI('/path/to/openapi.json');
} catch (error) {
  if (error instanceof DereferenceError) {
    console.error(error.message);  // 'Failed to dereference OpenAPI Document at "/path/to/openapi.json"'
    console.error(error.cause);    // Original error from underlying resolver
  }
}
```

### Working with the result

Both `dereferenceArazzo` and `dereferenceOpenAPI` functions return a [ParseResultElement](https://github.com/speclynx/apidom/blob/main/packages/apidom-datamodel/README.md#parseresultelement) with all references resolved inline.

```js
import { dereferenceArazzo } from '@jentic/arazzo-resolver';

const parseResult = await dereferenceArazzo('/path/to/arazzo.json');

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

#### Retrieval URI metadata

Both `dereferenceArazzo` and `dereferenceOpenAPI` functions automatically set `retrievalURI` metadata on the parse result:

```js
import { dereferenceArazzo, dereferenceOpenAPI } from '@jentic/arazzo-resolver';
import { toValue } from '@speclynx/apidom-core';

const arazzoResult = await dereferenceArazzo('https://example.com/arazzo.yaml');
const arazzoUri = toValue(arazzoResult.meta.get('retrievalURI'));
// 'https://example.com/arazzo.yaml'

const openapiResult = await dereferenceOpenAPI('https://example.com/openapi.yaml');
const openapiUri = toValue(openapiResult.meta.get('retrievalURI'));
// 'https://example.com/openapi.yaml'
```

Note: `dereferenceArazzoElement` and `dereferenceOpenAPIElement` do not set `retrievalURI` - they preserve whatever metadata was on the original element.

## SpecLynx ApiDOM tooling

Since `@jentic/arazzo-resolver` produces a SpecLynx ApiDOM data model, you have access to the full suite of ApiDOM tools for manipulating, traversing, and transforming the dereferenced document.

### Core utilities

The [@speclynx/apidom-core](https://github.com/speclynx/apidom/tree/main/packages/apidom-core) package provides essential utilities for working with ApiDOM elements. Here are just a few examples:

```js
import { dereferenceArazzo } from '@jentic/arazzo-resolver';
import { cloneDeep, cloneShallow } from '@speclynx/apidom-datamodel';
import { toValue, toJSON, toYAML, sexprs } from '@speclynx/apidom-core';

const parseResult = await dereferenceArazzo('/path/to/arazzo.json');
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
import { dereferenceArazzo } from '@jentic/arazzo-resolver';
import { traverse } from '@speclynx/apidom-traverse';

const parseResult = await dereferenceArazzo('/path/to/arazzo.json');

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
