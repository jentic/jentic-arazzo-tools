# @jentic/arazzo-parser

`@jentic/arazzo-parser` is a parser for [Arazzo Specification](https://spec.openapis.org/arazzo/latest.html) documents.
It produces [SpecLynx ApiDOM](https://github.com/speclynx/apidom) data model as output.

## Installation

You can install this package via [npm](https://npmjs.org/) CLI by running the following command:

```sh
npm install @jentic/arazzo-parser
```

## Usage

`@jentic/arazzo-parser` provides a unified `parse` function that accepts multiple input types:

1. **Plain JavaScript object** - directly refracts into ApiDOM
2. **String content** - parses inline JSON or YAML Arazzo Documents
3. **File system path** - resolves and parses local Arazzo Documents
4. **HTTP(S) URL** - fetches and parses remote Arazzo Documents

### Parsing from object

```js
import { parse } from '@jentic/arazzo-parser';

const arazzoDocument = {
  arazzo: '1.0.1',
  info: {
    title: 'My API Workflow',
    version: '1.0.0',
  },
  sourceDescriptions: [
    {
      name: 'myApi',
      type: 'openapi',
      url: 'https://example.com/openapi.json',
    },
  ],
  workflows: [],
};

const parseResult = await parse(arazzoDocument);
// parseResult is ParseResultElement containing ArazzoSpecification1Element
```

### Parsing from string

```js
import { parse } from '@jentic/arazzo-parser';

// JSON string
const parseResult = await parse('{"arazzo": "1.0.1", "info": {...}}');

// YAML string
const parseResult = await parse(`
arazzo: '1.0.1'
info:
  title: My API Workflow
  version: '1.0.0'
`);
```

### Parsing from file

```js
import { parse } from '@jentic/arazzo-parser';

const parseResult = await parse('/path/to/arazzo.json');
```

### Parsing from URL

```js
import { parse } from '@jentic/arazzo-parser';

const parseResult = await parse('https://example.com/arazzo.yaml');
```

## Parse options

The `parse` function accepts an optional second argument with parsing options:

```js
import { parse } from '@jentic/arazzo-parser';

const parseResult = await parse(source, {
  strict: true,      // Use strict parsing mode (default: true)
  sourceMap: false,  // Include source maps (default: false)
  parserOpts: {},    // Additional parser options (default: {})
  resolverOpts: {},  // Additional resolver options (default: {})
});
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `strict` | `boolean` | `true` | Whether to enforce strict parsing mode. Strict mode uses native JSON and YAML parsers without error recovery. |
| `sourceMap` | `boolean` | `false` | Whether to include source maps in the parsed result. |
| `parserOpts` | `Record<string, unknown>` | `{}` | Additional options passed to the underlying parsers. |
| `resolverOpts` | `Record<string, unknown>` | `{}` | Additional options passed to the underlying resolvers. |

### Default options

You can import the default options:

```js
import { defaultParseOptions } from '@jentic/arazzo-parser';

console.log(defaultParseOptions);
// { strict: true, sourceMap: false, parserOpts: {}, resolverOpts: {} }
```

## Error handling

When parsing fails, a `ParseError` is thrown. The original error is available via the `cause` property:

```js
import { parse } from '@jentic/arazzo-parser';

try {
  await parse('invalid content');
} catch (error) {
  console.error(error.message);  // 'Failed to parse Arazzo Document'
  console.error(error.cause);    // Original error from underlying parser
}
```

## Working with the result

The `parse` function returns a `ParseResultElement` from SpecLynx ApiDOM:

```js
import { parse } from '@jentic/arazzo-parser';

const parseResult = await parse(source);

// Access the main Arazzo specification element
const arazzoSpec = parseResult.api;

// Check if parsing produced any errors
const hasErrors = parseResult.errors.length > 0;

// Check if parseResult is empty
const isEmpty = parseResult.isEmpty;
```

## SpecLynx ApiDOM tooling

Since `@jentic/arazzo-parser` produces a SpecLynx ApiDOM data model, you have access to the full suite of ApiDOM tools for manipulating, traversing, and transforming the parsed document.

### Core utilities

The [@speclynx/apidom-core](https://github.com/speclynx/apidom/tree/main/packages/apidom-core) package provides essential utilities for working with ApiDOM elements. Here are just a few examples:

```js
import { parse } from '@jentic/arazzo-parser';
import { toValue, toJSON, toYAML, clone, sexprs } from '@speclynx/apidom-core';

const parseResult = await parse(source);
const arazzoSpec = parseResult.api;

// Convert to plain JavaScript object
const obj = toValue(arazzoSpec);

// Serialize to JSON string
const json = toJSON(arazzoSpec);

// Serialize to YAML string
const yaml = toYAML(arazzoSpec);

// Deep clone the element
const cloned = clone(arazzoSpec);

// Get S-expression representation (useful for debugging)
const sexpr = sexprs(arazzoSpec);
```

### Traversal

The [@speclynx/apidom-traverse](https://github.com/speclynx/apidom/tree/main/packages/apidom-traverse) package provides powerful traversal capabilities. Here is a basic example:

```js
import { parse } from '@jentic/arazzo-parser';
import { traverse } from '@speclynx/apidom-traverse';

const parseResult = await parse(source);

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
