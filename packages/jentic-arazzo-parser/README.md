# @jentic/arazzo-parser

`@jentic/arazzo-parser` is a parser for [Arazzo Specification](https://spec.openapis.org/arazzo/latest.html) documents.
It produces [SpecLynx ApiDOM](https://github.com/speclynx/apidom) data model using the [Arazzo 1.x namespace](https://github.com/speclynx/apidom/tree/main/packages/apidom-ns-arazzo-1#readme).

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

The `parse` function accepts an optional second argument with reference options compatible with [SpecLynx ApiDOM Reference Options](https://github.com/speclynx/apidom/blob/main/packages/apidom-reference/src/options/index.ts):

```js
import { parse } from '@jentic/arazzo-parser';

const parseResult = await parse(source, {
  parse: {
    parserOpts: {
      strict: true,      // Use strict parsing mode (default: true)
      sourceMap: false,  // Include source maps (default: false)
    },
  },
});
```

### Default options

You can import the default options:

```js
import { defaultOptions } from '@jentic/arazzo-parser';

console.log(defaultOptions);
// {
//   parse: {
//     parsers: [...],
//     parserOpts: {},
//   },
//   resolve: {
//     resolvers: [...],
//     resolverOpts: {},
//   },
// }
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

The `parse` function returns a [ParseResultElement](https://github.com/speclynx/apidom/blob/main/packages/apidom-datamodel/README.md#parseresultelement) representing the result of the parsing operation.

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

### Retrieval URI metadata

When parsing from a file system path or HTTP(S) URL, the `retrievalURI` metadata is set on the parse result:

```js
import { parse } from '@jentic/arazzo-parser';
import { toValue } from '@speclynx/apidom-core';

const parseResult = await parse('/path/to/arazzo.json');

// Get the URI from which the document was retrieved
const uri = toValue(parseResult.meta.get('retrievalURI'));
// '/path/to/arazzo.json'
```

Note: `retrievalURI` is not set when parsing from inline content (string) or plain objects.

### Source maps

Source maps allow you to track the original position (line, column) of each element in the parsed document. This is useful for error reporting, IDE integrations, linting, and any tooling that needs to show precise locations in the original source.

To enable source maps, set `sourceMap: true` in the parser options:

```js
import { parse } from '@jentic/arazzo-parser';

const parseResult = await parse('/path/to/arazzo.yaml', {
  parse: {
    parserOpts: {
      sourceMap: true,
    },
  },
});
```

When source maps are enabled, each element in the parsed result contains positional properties stored directly on the element. Position values use UTF-16 code units for compatibility with Language Server Protocol (LSP) and JavaScript string indexing:

```js
import { parse } from '@jentic/arazzo-parser';

const parseResult = await parse('/path/to/arazzo.yaml', {
  parse: { parserOpts: { sourceMap: true } },
});

const arazzoSpec = parseResult.api;

// Access source map properties directly on the element
arazzoSpec.startLine;      // 0-based line number where element begins
arazzoSpec.startCharacter; // 0-based column number where element begins
arazzoSpec.startOffset;    // 0-based character offset from document start
arazzoSpec.endLine;        // 0-based line number where element ends
arazzoSpec.endCharacter;   // 0-based column number where element ends
arazzoSpec.endOffset;      // 0-based character offset where element ends

// Access source map on nested elements
const workflow = arazzoSpec.workflows.get(0);
console.log(`Workflow starts at line ${workflow.startLine}, column ${workflow.startCharacter}`);
```

For more details about source maps, see the [SpecLynx ApiDOM Data Model documentation](https://github.com/speclynx/apidom/tree/main/packages/apidom-datamodel#source-maps).

**Note:** Source maps are only available when parsing from string content, file paths, or URLs. When parsing from a plain JavaScript object, source maps cannot be generated and attempting to enable them will throw a `ParseError`:

```js
// This will throw ParseError
await parse({ arazzo: '1.0.1', ... }, {
  parse: { parserOpts: { sourceMap: true } },
});
```

## SpecLynx ApiDOM tooling

Since `@jentic/arazzo-parser` produces a SpecLynx ApiDOM data model, you have access to the full suite of ApiDOM tools for manipulating, traversing, and transforming the parsed document.

### Core utilities

The [@speclynx/apidom-core](https://github.com/speclynx/apidom/tree/main/packages/apidom-core) package provides essential utilities for working with ApiDOM elements. Here are just a few examples:

```js
import { parse } from '@jentic/arazzo-parser';
import { cloneDeep, cloneShallow } from '@spelynx/apidom-datamodel';
import { toValue, toJSON, toYAML, sexprs } from '@speclynx/apidom-core';

const parseResult = await parse(source);
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
