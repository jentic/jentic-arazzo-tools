# @jentic/arazzo-parser

`@jentic/arazzo-parser` is a parser for [Arazzo Specification](https://spec.openapis.org/arazzo/latest.html) documents.
It produces [SpecLynx ApiDOM](https://github.com/speclynx/apidom) data model using the [Arazzo 1.x namespace](https://github.com/speclynx/apidom/tree/main/packages/apidom-ns-arazzo-1#readme).

**Supported Arazzo versions:**
- [Arazzo 1.0.0](https://spec.openapis.org/arazzo/v1.0.0)
- [Arazzo 1.0.1](https://spec.openapis.org/arazzo/v1.0.1)

**Supported OpenAPI versions (for source descriptions):**
- [OpenAPI 2.0](https://spec.openapis.org/oas/v2.0)
- [OpenAPI 3.0.x](https://spec.openapis.org/oas/v3.0.4)
- [OpenAPI 3.1.x](https://spec.openapis.org/oas/v3.1.2)

## Installation

You can install this package via [npm](https://npmjs.org/) CLI by running the following command:

```sh
npm install @jentic/arazzo-parser
```

## Usage

`@jentic/arazzo-parser` provides a `parseArazzo` function for parsing Arazzo documents.

## Parsing Arazzo Documents

The `parseArazzo` function accepts multiple input types:

1. **Plain JavaScript object** - converts to JSON and parses (source maps supported with `strict: false`)
2. **String content** - detects Arazzo content and parses inline JSON or YAML
3. **File system path** - resolves and parses local Arazzo Documents
4. **HTTP(S) URL** - fetches and parses remote Arazzo Documents

### From object

```js
import { parseArazzo } from '@jentic/arazzo-parser';

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

const parseResult = await parseArazzo(arazzoDocument);
// parseResult is ParseResultElement containing ArazzoSpecification1Element
```

### From string

```js
import { parseArazzo } from '@jentic/arazzo-parser';

// JSON string
const parseResult = await parseArazzo('{"arazzo": "1.0.1", "info": {...}}');

// YAML string
const parseResult = await parseArazzo(`
arazzo: '1.0.1'
info:
  title: My API Workflow
  version: '1.0.0'
`);
```

### From file

```js
import { parseArazzo } from '@jentic/arazzo-parser';

const parseResult = await parseArazzo('/path/to/arazzo.json');
```

### From URL

```js
import { parseArazzo } from '@jentic/arazzo-parser';

const parseResult = await parseArazzo('https://example.com/arazzo.yaml');
```

## Parse options

The `parseArazzo` function accepts an optional second argument with reference options compatible with [SpecLynx ApiDOM Reference Options](https://github.com/speclynx/apidom/blob/main/packages/apidom-reference/src/options/index.ts):

```js
import { parseArazzo } from '@jentic/arazzo-parser';

const parseResult = await parseArazzo(source, {
  parse: {
    parserOpts: {
      strict: true,      // Use strict parsing mode (default: true)
      sourceMap: false,  // Include source maps (default: false)
      style: false,      // Capture style information for round-trip preservation (default: false)
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
//     parsers: [
//       ArazzoJSON1Parser, ArazzoYAML1Parser,
//       OpenApiJSON2Parser, OpenApiYAML2Parser,
//       OpenApiJSON3_0Parser, OpenApiYAML3_0Parser,
//       OpenApiJSON3_1Parser, OpenApiYAML3_1Parser,
//     ],
//     parserOpts: { sourceMap: false, strict: true, sourceDescriptions: false },
//   },
//   resolve: {
//     resolvers: [MemoryResolver, FileResolver, HTTPResolverAxios],
//     resolverOpts: {},
//   },
// }
```

## Error handling

When parsing fails, a `ParseError` is thrown. The original error is available via the `cause` property:

```js
import { parseArazzo } from '@jentic/arazzo-parser';

try {
  await parseArazzo('invalid content');
} catch (error) {
  console.error(error.message);  // 'Failed to parse Arazzo Document'
  console.error(error.cause);    // Original error from underlying parser
}
```

## Working with the result

The `parseArazzo` function returns a [ParseResultElement](https://github.com/speclynx/apidom/blob/main/packages/apidom-datamodel/README.md#parseresultelement) representing the result of the parsing operation.

```js
import { parseArazzo } from '@jentic/arazzo-parser';

const parseResult = await parseArazzo(source);

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
import { parseArazzo } from '@jentic/arazzo-parser';

const parseResult = await parseArazzo('/path/to/arazzo.json');

// Get the URI from which the document was retrieved
const uri = parseResult.meta.get('retrievalURI');
// '/path/to/arazzo.json'
```

Note: `retrievalURI` is not set when parsing from inline content (string) or plain objects.

### Source maps

Source maps allow you to track the original position (line, column) of each element in the parsed document. This is useful for error reporting, IDE integrations, linting, and any tooling that needs to show precise locations in the original source.


To enable source maps, set `sourceMap: true` and `strict: false` in the parser options:

```js
import { parseArazzo } from '@jentic/arazzo-parser';

const parseResult = await parseArazzo('/path/to/arazzo.yaml', {
  parse: {
    parserOpts: {
      sourceMap: true,
      strict: false,
    },
  },
});
```

When source maps are enabled, each element in the parsed result contains positional properties stored directly on the element. Position values use UTF-16 code units for compatibility with Language Server Protocol (LSP) and JavaScript string indexing:

```js
import { parseArazzo } from '@jentic/arazzo-parser';

const parseResult = await parseArazzo('/path/to/arazzo.yaml', {
  parse: { parserOpts: { sourceMap: true, strict: false } },
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

**Note:** Source maps require `strict: false` to be set. When parsing from objects, they are converted to pretty-printed JSON strings internally (2-space indentation), so source map positions refer to this generated JSON representation, not the original object structure:

```js
// Source maps with objects (requires strict: false)
// Positions will reference the internally generated JSON string
await parseArazzo({ arazzo: '1.0.1', ... }, {
  parse: {
    parserOpts: {
      sourceMap: true,
      strict: false
    }
  },
});
```

### Style preservation

Style preservation captures format-specific style information for round-trip preservation. When enabled, the parser records formatting details (e.g., YAML quoting styles, flow/block indicators, comments, indentation; JSON indentation, raw number representation) on each parsed element. These details can then be used by [`toYAML`](https://github.com/speclynx/apidom/tree/main/packages/apidom-core#toyaml) and [`toJSON`](https://github.com/speclynx/apidom/tree/main/packages/apidom-core#tojson) from `@speclynx/apidom-core` to reproduce the original formatting.

To enable style preservation, set `style: true` and `strict: false` in the parser options:

```js
import { parseArazzo } from '@jentic/arazzo-parser';
import { toYAML } from '@speclynx/apidom-core';

const parseResult = await parseArazzo('/path/to/arazzo.yaml', {
  parse: {
    parserOpts: {
      style: true,
      strict: false,
    },
  },
});

// round-trip back to YAML preserving original formatting
const yaml = toYAML(parseResult.api, { preserveStyle: true });
```

```js
import { parseArazzo } from '@jentic/arazzo-parser';
import { toJSON } from '@speclynx/apidom-core';

const parseResult = await parseArazzo('/path/to/arazzo.json', {
  parse: {
    parserOpts: {
      style: true,
      strict: false,
    },
  },
});

// round-trip back to JSON preserving original formatting
const json = toJSON(parseResult.api, undefined, undefined, { preserveStyle: true });
```

**Note:** Style preservation requires `strict: false`. Both `style` and `sourceMap` can be enabled simultaneously — they are independent features.

## Parsing source descriptions

Arazzo documents can reference external API specifications (OpenAPI, Arazzo) through [Source Descriptions](https://spec.openapis.org/arazzo/latest.html#source-description-object). The parser can automatically fetch and parse these referenced documents.

**Note:** Source descriptions parsing is disabled by default for performance reasons. Enable it explicitly when you need to resolve and parse referenced API specifications.

### Enabling source descriptions parsing

To parse source descriptions, enable the `sourceDescriptions` option in `parserOpts`:

```js
import { parseArazzo } from '@jentic/arazzo-parser';

const parseResult = await parseArazzo('/path/to/arazzo.json', {
  parse: {
    parserOpts: {
      sourceDescriptions: true,
    },
  },
});
```

Alternatively, you can configure it per parser for more granular control:

```js
const parseResult = await parseArazzo('/path/to/arazzo.json', {
  parse: {
    parserOpts: {
      'arazzo-json-1': { sourceDescriptions: true },
      'arazzo-yaml-1': { sourceDescriptions: true },
    },
  },
});
```

### Selective parsing

You can selectively parse only specific source descriptions by providing an array of names:

```js
const parseResult = await parseArazzo('/path/to/arazzo.json', {
  parse: {
    parserOpts: {
      sourceDescriptions: ['petStoreApi', 'paymentApi'],
    },
  },
});
```

### Result structure

When source descriptions are parsed, each parsed document that is a *direct* source description of the main Arazzo document is added to the main `ParseResultElement` as an additional top-level element. The first element is always the main Arazzo document, and subsequent top-level elements are these directly parsed source descriptions. When recursive parsing discovers further source descriptions from within an already parsed source description, those recursively parsed documents are attached as nested `ParseResultElement` instances beneath the source-description element that referenced them (they are not duplicated at the top level). Consumers that need to see all documents should traverse both the top-level elements and any nested `ParseResultElement`s reachable from source-description elements.

Source descriptions are parsed into their appropriate SpecLynx ApiDOM namespace data models based on document type:

- [Arazzo 1.x](https://spec.openapis.org/arazzo/latest.html) → [@speclynx/apidom-ns-arazzo-1](https://github.com/speclynx/apidom/tree/main/packages/apidom-ns-arazzo-1)
- [OpenAPI 2.0 (Swagger)](https://spec.openapis.org/oas/v2.0) → [@speclynx/apidom-ns-openapi-2](https://github.com/speclynx/apidom/tree/main/packages/apidom-ns-openapi-2)
- [OpenAPI 3.0.x](https://spec.openapis.org/oas/v3.0.4) → [@speclynx/apidom-ns-openapi-3-0](https://github.com/speclynx/apidom/tree/main/packages/apidom-ns-openapi-3-0)
- [OpenAPI 3.1.x](https://spec.openapis.org/oas/v3.1.2) → [@speclynx/apidom-ns-openapi-3-1](https://github.com/speclynx/apidom/tree/main/packages/apidom-ns-openapi-3-1)

```
ParseResultElement
├── .api: ArazzoSpecification1Element
│
├── ParseResultElement (petStoreApi)        ─┐
│   └── .api: OpenApi3_1Element              │ source
│                                            │ descriptions
└── ParseResultElement (legacyApi)          ─┘
    ├── .errors
    └── .warnings
```

```js
import { parseArazzo } from '@jentic/arazzo-parser';
import { toValue } from '@speclynx/apidom-core';

const parseResult = await parseArazzo('/path/to/arazzo.json', {
  parse: {
    parserOpts: {
      sourceDescriptions: true,
    },
  },
});

// Main Arazzo document
const arazzoSpec = parseResult.api;

// Number of elements (1 main + N source descriptions)
console.log(parseResult.length);

// Access parsed source descriptions (filter by 'source-description' class)
for (let i = 0; i < parseResult.length; i++) {
  const element = parseResult.get(i);

  if (element.classes.includes('source-description')) {
    // Source description metadata
    const name = toValue(element.meta.get('name'));
    const type = toValue(element.meta.get('type'));

    console.log(`Source description "${name}" (${type})`);

    // The parsed API document
    const api = element.api;
  }
}
```

### Accessing via SourceDescriptionElement

An alternative way to access parsed source descriptions is through the `SourceDescriptionElement` metadata.
When source descriptions are parsed, a `ParseResultElement` is attached to each `SourceDescriptionElement`'s metadata under the key `'parseResult'`.

```js
import { parseArazzo } from '@jentic/arazzo-parser';
import { toValue } from '@speclynx/apidom-core';

const parseResult = await parseArazzo('/path/to/arazzo.json', {
  parse: {
    parserOpts: {
      sourceDescriptions: true,
    },
  },
});

const arazzoSpec = parseResult.api;

// Access parsed document via SourceDescriptionElement
const sourceDesc = arazzoSpec.sourceDescriptions.get(0);
const sdParseResult = sourceDesc.meta.get('parseResult');

// Check for errors before using
if (sdParseResult.errors.length === 0) {
  // Access the parsed API
  const api = sdParseResult.api;
  console.log(`API type: ${api.element}`); // e.g., 'openApi3_1'

  // Get the retrieval URI
  const retrievalURI = sdParseResult.meta.get('retrievalURI');
  console.log(`Loaded from: ${retrievalURI}`);
}
```

This approach is useful when you need to:
- Access a specific source description by its position in the `sourceDescriptions` array
- Get the `retrievalURI` metadata indicating where the document was fetched from
- Correlate parsed documents with their source description definitions

### Recursive parsing

When a source description is of type `arazzo`, the parser recursively parses that document's source descriptions as well. This allows you to parse entire dependency trees of Arazzo documents.

### Limiting recursion depth

To prevent excessive recursion or handle deeply nested documents, use the `sourceDescriptionsMaxDepth` option:

```js
const parseResult = await parseArazzo('/path/to/arazzo.json', {
  parse: {
    parserOpts: {
      sourceDescriptions: true,
      sourceDescriptionsMaxDepth: 2, // Only parse 2 levels deep
    },
  },
});
```

The default value is `+Infinity` (no limit). Setting it to `0` will create error annotations instead of parsing any source descriptions.

### Cycle detection

The parser automatically detects circular references between Arazzo documents. When a cycle is detected, a warning annotation is added instead of causing infinite recursion:

```js
// arazzo-a.json references arazzo-b.json
// arazzo-b.json references arazzo-a.json (cycle!)

const parseResult = await parseArazzo('/path/to/arazzo-a.json', {
  parse: {
    parserOpts: {
      sourceDescriptions: true,
    },
  },
});

// The cycle is handled gracefully - check for warning annotations
```

### Error and warning handling

When issues occur during source description parsing, the parser does not throw errors. Instead, it adds annotation elements to the source description's parse result:

- **`error`** class - Parsing failed (e.g., file not found, invalid document, max depth exceeded)
- **`warning`** class - Non-fatal issues (e.g., cycle detected, type mismatch between declared and actual)

This allows partial parsing to succeed even if some source descriptions have issues:

```js
const parseResult = await parseArazzo('/path/to/arazzo.json', {
  parse: {
    parserOpts: {
      sourceDescriptions: true,
    },
  },
});

// Check each source description for errors and warnings
for (let i = 0; i < parseResult.length; i++) {
  const element = parseResult.get(i);

  if (element.classes.includes('source-description')) {
    const name = toValue(element.meta.get('name'));

    // Use built-in accessors for errors and warnings
    element.errors.forEach((error) => {
      console.error(`Error in "${name}": ${toValue(error)}`);
    });

    element.warnings.forEach((warning) => {
      console.warn(`Warning in "${name}": ${toValue(warning)}`);
    });
  }
}
```

## Parsing OpenAPI Documents

The `parseOpenAPI` function provides complete control for parsing OpenAPI documents manually.
This is useful when you need to parse source descriptions independently or implement custom source description resolution logic.

The function accepts the same input types as `parseArazzo`:

1. **Plain JavaScript object** - converts to JSON and parses
2. **String content** - detects OpenAPI content and parses inline JSON or YAML
3. **File system path** - resolves and parses local OpenAPI Documents
4. **HTTP(S) URL** - fetches and parses remote OpenAPI Documents

Documents are parsed into their appropriate SpecLynx ApiDOM namespace data models:

- [OpenAPI 2.0 (Swagger)](https://spec.openapis.org/oas/v2.0) → [@speclynx/apidom-ns-openapi-2](https://github.com/speclynx/apidom/tree/main/packages/apidom-ns-openapi-2)
- [OpenAPI 3.0.x](https://spec.openapis.org/oas/v3.0.4) → [@speclynx/apidom-ns-openapi-3-0](https://github.com/speclynx/apidom/tree/main/packages/apidom-ns-openapi-3-0)
- [OpenAPI 3.1.x](https://spec.openapis.org/oas/v3.1.2) → [@speclynx/apidom-ns-openapi-3-1](https://github.com/speclynx/apidom/tree/main/packages/apidom-ns-openapi-3-1)

```js
import { parseOpenAPI } from '@jentic/arazzo-parser';

// From object
const parseResult = await parseOpenAPI({
  openapi: '3.1.0',
  info: { title: 'My API', version: '1.0.0' },
  paths: {},
});

// From string
const parseResult = await parseOpenAPI('{"openapi": "3.1.0", ...}');

// From file
const parseResult = await parseOpenAPI('/path/to/openapi.json');

// From URL
const parseResult = await parseOpenAPI('https://example.com/openapi.yaml');
```

## SpecLynx ApiDOM tooling

Since `@jentic/arazzo-parser` produces a SpecLynx ApiDOM data model, you have access to the full suite of ApiDOM tools for manipulating, traversing, and transforming the parsed document.

### Core utilities

The [@speclynx/apidom-core](https://github.com/speclynx/apidom/tree/main/packages/apidom-core) package provides essential utilities for working with ApiDOM elements. Here are just a few examples:

```js
import { parseArazzo } from '@jentic/arazzo-parser';
import { cloneDeep, cloneShallow } from '@speclynx/apidom-datamodel';
import { toValue, toJSON, toYAML, sexprs } from '@speclynx/apidom-core';

const parseResult = await parseArazzo(source);
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
import { parseArazzo } from '@jentic/arazzo-parser';
import { traverse } from '@speclynx/apidom-traverse';

const parseResult = await parseArazzo(source);

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
