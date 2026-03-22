# @jentic/arazzo-validator

`@jentic/arazzo-validator` is a validator and linter for [Arazzo Specification](https://spec.openapis.org/arazzo/latest.html) documents.
It performs JSON Schema validation, semantic validation, and semantic linting using [SpecLynx ApiDOM Language Service](https://www.npmjs.com/package/@speclynx/apidom-ls).

**Supported Arazzo versions:**
- [Arazzo 1.0.0](https://spec.openapis.org/arazzo/v1.0.0)
- [Arazzo 1.0.1](https://spec.openapis.org/arazzo/v1.0.1)

**Requirements:**
- Node.js >= 20.10.0

## Installation

You can install this package via [npm](https://npmjs.org/) CLI by running the following command:

```sh
npm install @jentic/arazzo-validator
```

## CLI

Validate Arazzo documents from the command line:

```sh
npx @jentic/arazzo-validator arazzo.yaml
```

### Options

| Option | Description |
|--------|-------------|
| `[file]` | File path or URL to validate |
| `--stdin-retrieval-uri <uri>` | Read from stdin, use URI for reference resolution |
| `-f, --format <format>` | Output format: `stylish` (default), `codeframe`, `json`, `github-actions` |
| `-o, --output <file>` | Write output to file instead of stdout |
| `--fail-severity <level>` | Minimum severity to trigger failure: `error` (default), `warning`, `info`, `hint` |
| `--max-problems <n>` | Limit output to N problems |
| `-q, --quiet` | Suppress output, only return exit code |
| `-v, --verbose` | Show additional information |

### Output formats

**stylish** (default) - Compact, colored output similar to ESLint:
```text
/path/to/arazzo.yaml
  1:1  error  json-schema  Object must have required property "sourceDescriptions"
  2:1  error  json-schema  "info" property must have required property "version"

✖ 2 problems (2 errors, 0 warnings)
```

**codeframe** - Shows code snippets with context:
```text
/path/to/arazzo.yaml
  2:1  error  json-schema  "info" property must have required property "version"

 1 | arazzo: "1.0.0"
 2 | info:
   | ^^^^
 3 |   title: Test

✖ 1 problem (1 error, 0 warnings)
```

**json** - Machine-readable JSON output with diagnostics and summary.

**github-actions** - GitHub Actions workflow annotations for CI integration.

### Examples

```sh
# Validate a file (with options)
npx @jentic/arazzo-validator --format json --fail-severity warning arazzo.yaml

# Validate a URL
npx @jentic/arazzo-validator https://example.com/arazzo.yaml

# Read from stdin
cat arazzo.yaml | npx @jentic/arazzo-validator --stdin-retrieval-uri file:///arazzo.yaml
```

### Exit codes

| Code | Description |
|------|-------------|
| `0` | Success (no diagnostics at or above fail-severity level) |
| `1` | Validation errors found |
| `2` | CLI error (invalid arguments, file not found, etc.) |

When installed, the `arazzo-validator` command is available directly:

```sh
npm install @jentic/arazzo-validator
arazzo-validator arazzo.yaml
```

## Programmatic API

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

## Semantic validation and linting

## Info Object (target: `info`)

| Code | Rule File | Description |
|------|-----------|-------------|
| ARAZZO_INFO_FIELD_TITLE_REQUIRED | title--required | title field is required |
| ARAZZO_INFO_FIELD_TITLE_TYPE | title--type | title must be a string |
| ARAZZO_INFO_FIELD_DESCRIPTION_TYPE | description--type | description must be a string |
| ARAZZO_INFO_FIELD_SUMMARY_TYPE | summary--type | summary must be a string |
| ARAZZO_INFO_FIELD_VERSION_REQUIRED | version--required | version field is required |
| ARAZZO_INFO_FIELD_VERSION_TYPE | version--type | version must be a string |
| NOT_ALLOWED_FIELDS | allowed-fields-2-0--3-0 | Only title, description, summary, version + x- allowed |
| ARAZZO_INFO_FIELD_DESCRIPTION_RECOMMENDED | description--recommended | description should be present (warning) |
| ARAZZO_INFO_FIELD_SUMMARY_RECOMMENDED | summary--recommended | summary is recommended (hint) |

## Arazzo Specification Object (target: `arazzoSpecification1`)

| Code | Rule File | Description |
|------|-----------|-------------|
| ARAZZO_SPEC_FIELD_ARAZZO_REQUIRED | arazzo--required | arazzo version field required |
| ARAZZO_SPEC_FIELD_ARAZZO_TYPE | arazzo--type | arazzo must be a string |
| ARAZZO_SPEC_FIELD_ARAZZO_PATTERN | arazzo--pattern | arazzo must match ^1\.0\.\d+(-.+)?$ |
| ARAZZO_SPEC_FIELD_INFO_REQUIRED | info--required | info field required |
| ARAZZO_SPEC_FIELD_INFO_TYPE | info--type | info must be an info object |
| ARAZZO_SPEC_FIELD_SOURCE_DESCRIPTIONS_REQUIRED | source-descriptions--required | sourceDescriptions required |
| ARAZZO_SPEC_FIELD_SOURCE_DESCRIPTIONS_TYPE | source-descriptions--type | sourceDescriptions must be array of sourceDescription |
| ARAZZO_SPEC_FIELD_SOURCE_DESCRIPTIONS_NON_EMPTY | source-descriptions--non-empty | sourceDescriptions must have at least one entry |
| ARAZZO_SPEC_FIELD_WORKFLOWS_REQUIRED | workflows--required | workflows required |
| ARAZZO_SPEC_FIELD_WORKFLOWS_TYPE | workflows--type | workflows must be array of workflow |
| ARAZZO_SPEC_FIELD_WORKFLOWS_NON_EMPTY | workflows--non-empty | workflows must have at least one entry |
| ARAZZO_SPEC_FIELD_COMPONENTS_TYPE | components--type | components must be a components object |
| NOT_ALLOWED_FIELDS | allowed-fields | Only arazzo, info, sourceDescriptions, workflows, components + x- |
| ARAZZO_SPEC_NO_SCRIPT_TAGS | no-script-tags | No `<script>` tags in description/title fields (error) |

## Source Description Object (target: `sourceDescription`)

| Code | Rule File | Description |
|------|-----------|-------------|
| ARAZZO_SOURCE_DESCRIPTION_FIELD_NAME_REQUIRED | name--required | name field required |
| ARAZZO_SOURCE_DESCRIPTION_FIELD_NAME_TYPE | name--type | name must be a string |
| ARAZZO_SOURCE_DESCRIPTION_FIELD_NAME_PATTERN | name--pattern | name must match [A-Za-z0-9_\-]+ |
| ARAZZO_SOURCE_DESCRIPTION_FIELD_URL_REQUIRED | url--required | url field required |
| ARAZZO_SOURCE_DESCRIPTION_FIELD_URL_TYPE | url--type | url must be a string |
| ARAZZO_SOURCE_DESCRIPTION_FIELD_TYPE_TYPE | type--type | type must be a string |
| ARAZZO_SOURCE_DESCRIPTION_FIELD_TYPE_EQUALS | type--equals | type must be openapi or arazzo |
| NOT_ALLOWED_FIELDS | allowed-fields | Only name, url, type + x- |

## Workflow Object (target: `workflow`)

| Code | Rule File | Description |
|------|-----------|-------------|
| ARAZZO_WORKFLOW_FIELD_WORKFLOW_ID_REQUIRED | workflow-id--required | workflowId required |
| ARAZZO_WORKFLOW_FIELD_WORKFLOW_ID_TYPE | workflow-id--type | workflowId must be a string |
| ARAZZO_WORKFLOW_FIELD_WORKFLOW_ID_PATTERN | workflow-id--pattern | workflowId must match [A-Za-z0-9_\-]+ |
| ARAZZO_WORKFLOW_FIELD_SUMMARY_TYPE | summary--type | summary must be a string |
| ARAZZO_WORKFLOW_FIELD_DESCRIPTION_TYPE | description--type | description must be a string |
| ARAZZO_WORKFLOW_FIELD_INPUTS_TYPE | inputs--type | inputs must be a JSONSchema object |
| ARAZZO_WORKFLOW_FIELD_STEPS_REQUIRED | steps--required | steps required |
| ARAZZO_WORKFLOW_FIELD_STEPS_TYPE | steps--type | steps must be array of step |
| ARAZZO_WORKFLOW_FIELD_STEPS_NON_EMPTY | steps--non-empty | steps must have at least one entry |
| ARAZZO_WORKFLOW_FIELD_DEPENDS_ON_TYPE | depends-on--type | dependsOn must be array of strings |
| ARAZZO_WORKFLOW_FIELD_SUCCESS_ACTIONS_TYPE | success-actions--type | successActions array of successAction/reusable |
| ARAZZO_WORKFLOW_FIELD_FAILURE_ACTIONS_TYPE | failure-actions--type | failureActions array of failureAction/reusable |
| ARAZZO_WORKFLOW_FIELD_OUTPUTS_TYPE | outputs--type | outputs must be an object |
| ARAZZO_WORKFLOW_FIELD_OUTPUTS_KEYS_PATTERN | outputs--keys-pattern | output keys match [a-zA-Z0-9.\-_]+ |
| ARAZZO_WORKFLOW_FIELD_OUTPUTS_VALUES_TYPE | outputs--values-type | output values must be strings (Runtime Expressions) |
| ARAZZO_WORKFLOW_FIELD_PARAMETERS_TYPE | parameters--type | parameters array of parameter/reusable |
| NOT_ALLOWED_FIELDS | allowed-fields | Allowed fields list + x- |
| ARAZZO_WORKFLOW_FIELD_DESCRIPTION_RECOMMENDED | description--recommended | description should be present (warning) |
| ARAZZO_WORKFLOW_FIELD_SUMMARY_RECOMMENDED | summary--recommended | summary is recommended (hint) |
| ARAZZO_WORKFLOW_FIELD_WORKFLOW_ID_UNIQUE | workflow-id--unique | workflowId must be unique across all workflows |
| ARAZZO_WORKFLOW_FIELD_STEP_ID_UNIQUE | step-id--unique | stepId must be unique within each workflow |
| ARAZZO_WORKFLOW_FIELD_OUTPUTS_NAMES_UNIQUE | outputs--names-unique | output names must be unique per workflow |
| ARAZZO_WORKFLOW_FIELD_OUTPUTS_VALUES_RUNTIME_EXPRESSION | outputs--values-runtime-expression | output values must be valid Runtime Expressions |
| ARAZZO_WORKFLOW_FIELD_DEPENDS_ON_UNIQUE | depends-on--unique | dependsOn entries must be unique |
| ARAZZO_WORKFLOW_FIELD_DEPENDS_ON_RESOLVED | depends-on--resolved | dependsOn entries must resolve to existing workflows |

## Step Object (target: `step`)

| Code | Rule File | Description |
|------|-----------|-------------|
| ARAZZO_STEP_FIELD_STEP_ID_REQUIRED | step-id--required | stepId required |
| ARAZZO_STEP_FIELD_STEP_ID_TYPE | step-id--type | stepId must be a string |
| ARAZZO_STEP_FIELD_STEP_ID_PATTERN | step-id--pattern | stepId must match [A-Za-z0-9_\-]+ |
| ARAZZO_STEP_FIELD_DESCRIPTION_TYPE | description--type | description must be a string |
| ARAZZO_STEP_FIELD_OPERATION_ID_TYPE | operation-id--type | operationId must be a string |
| ARAZZO_STEP_FIELD_OPERATION_PATH_TYPE | operation-path--type | operationPath must be a string |
| ARAZZO_STEP_FIELD_WORKFLOW_ID_TYPE | workflow-id--type | workflowId must be a string |
| ARAZZO_STEP_FIELD_REQUEST_BODY_TYPE | request-body--type | requestBody must be a requestBody object |
| ARAZZO_STEP_FIELD_SUCCESS_CRITERIA_TYPE | success-criteria--type | successCriteria array of criterion |
| ARAZZO_STEP_FIELD_ON_SUCCESS_TYPE | on-success--type | onSuccess array of successAction/reusable |
| ARAZZO_STEP_FIELD_ON_FAILURE_TYPE | on-failure--type | onFailure array of failureAction/reusable |
| ARAZZO_STEP_FIELD_OUTPUTS_TYPE | outputs--type | outputs must be an object |
| ARAZZO_STEP_FIELD_OUTPUTS_KEYS_PATTERN | outputs--keys-pattern | output keys match [a-zA-Z0-9.\-_]+ |
| ARAZZO_STEP_FIELD_OUTPUTS_VALUES_TYPE | outputs--values-type | output values must be strings (Runtime Expressions) |
| ARAZZO_STEP_FIELD_PARAMETERS_TYPE | parameters--type | parameters array of parameter/reusable |
| ARAZZO_STEP_FIELD_OPERATION_ID_MUTUALLY_EXCLUSIVE | operation-id--mutually-exclusive | operationId is mutually exclusive with operationPath and workflowId |
| ARAZZO_STEP_FIELD_OPERATION_PATH_MUTUALLY_EXCLUSIVE | operation-path--mutually-exclusive | operationPath is mutually exclusive with operationId and workflowId |
| ARAZZO_STEP_FIELD_WORKFLOW_ID_MUTUALLY_EXCLUSIVE | workflow-id--mutually-exclusive | workflowId is mutually exclusive with operationId and operationPath |
| NOT_ALLOWED_FIELDS | allowed-fields | Allowed fields list + x- |
| ARAZZO_STEP_FIELD_DESCRIPTION_RECOMMENDED | description--recommended | description should be present (warning) |
| ARAZZO_STEP_FIELD_OPERATION_PATH_PREFER_OPERATION_ID | operation-path--prefer-operation-id | operationPath hint: prefer operationId |
| ARAZZO_STEP_FIELD_OUTPUTS_NAMES_UNIQUE | outputs--names-unique | output names must be unique per step |
| ARAZZO_STEP_FIELD_OUTPUTS_VALUES_RUNTIME_EXPRESSION | outputs--values-runtime-expression | output values must be valid Runtime Expressions |
| ARAZZO_STEP_FIELD_PARAMETERS_UNIQUE | parameters--unique | parameters must be unique by name+in per step |
| ARAZZO_STEP_FIELD_SUCCESS_ACTIONS_NAMES_UNIQUE | success-actions--names-unique | success action names must be unique per step |
| ARAZZO_STEP_FIELD_FAILURE_ACTIONS_NAMES_UNIQUE | failure-actions--names-unique | failure action names must be unique per step |
| ARAZZO_STEP_FIELD_WORKFLOW_ID_RESOLVED | workflow-id--resolved | workflowId must reference existing workflow |

## Parameter Object (target: `parameter`)

| Code | Rule File | Description |
|------|-----------|-------------|
| ARAZZO_PARAMETER_FIELD_NAME_REQUIRED | name--required | name required |
| ARAZZO_PARAMETER_FIELD_NAME_TYPE | name--type | name must be a string |
| ARAZZO_PARAMETER_FIELD_IN_TYPE | in--type | in must be a string |
| ARAZZO_PARAMETER_FIELD_IN_EQUALS | in--equals | in must be path/query/header/cookie |
| ARAZZO_PARAMETER_FIELD_VALUE_REQUIRED | value--required | value required |
| NOT_ALLOWED_FIELDS | allowed-fields | Only name, in, value + x- |
| ARAZZO_PARAMETER_FIELD_VALUE_RUNTIME_EXPRESSION | value--runtime-expression | value starting with $ must be valid Runtime Expression |

## Success Action Object (target: `successAction`)

| Code | Rule File | Description |
|------|-----------|-------------|
| ARAZZO_SUCCESS_ACTION_FIELD_NAME_REQUIRED | name--required | name required |
| ARAZZO_SUCCESS_ACTION_FIELD_NAME_TYPE | name--type | name must be a string |
| ARAZZO_SUCCESS_ACTION_FIELD_TYPE_REQUIRED | type--required | type required |
| ARAZZO_SUCCESS_ACTION_FIELD_TYPE_TYPE | type--type | type must be a string |
| ARAZZO_SUCCESS_ACTION_FIELD_TYPE_EQUALS | type--equals | type must be end or goto |
| ARAZZO_SUCCESS_ACTION_FIELD_WORKFLOW_ID_TYPE | workflow-id--type | workflowId must be a string |
| ARAZZO_SUCCESS_ACTION_FIELD_STEP_ID_TYPE | step-id--type | stepId must be a string |
| ARAZZO_SUCCESS_ACTION_FIELD_CRITERIA_TYPE | criteria--type | criteria array of criterion |
| ARAZZO_SUCCESS_ACTION_FIELD_WORKFLOW_ID_MUTUALLY_EXCLUSIVE | workflow-id--mutually-exclusive | workflowId is mutually exclusive with stepId |
| ARAZZO_SUCCESS_ACTION_FIELD_STEP_ID_MUTUALLY_EXCLUSIVE | step-id--mutually-exclusive | stepId is mutually exclusive with workflowId |
| NOT_ALLOWED_FIELDS | allowed-fields | Allowed fields + x- |
| ARAZZO_SUCCESS_ACTION_FIELD_WORKFLOW_ID_RESOLVED | workflow-id--resolved | workflowId must reference existing workflow |
| ARAZZO_SUCCESS_ACTION_FIELD_STEP_ID_RESOLVED | step-id--resolved | stepId must reference existing step in same workflow |

## Failure Action Object (target: `failureAction`)

| Code | Rule File | Description |
|------|-----------|-------------|
| ARAZZO_FAILURE_ACTION_FIELD_NAME_REQUIRED | name--required | name required |
| ARAZZO_FAILURE_ACTION_FIELD_NAME_TYPE | name--type | name must be a string |
| ARAZZO_FAILURE_ACTION_FIELD_TYPE_REQUIRED | type--required | type required |
| ARAZZO_FAILURE_ACTION_FIELD_TYPE_TYPE | type--type | type must be a string |
| ARAZZO_FAILURE_ACTION_FIELD_TYPE_EQUALS | type--equals | type must be end/goto/retry |
| ARAZZO_FAILURE_ACTION_FIELD_WORKFLOW_ID_TYPE | workflow-id--type | workflowId must be a string |
| ARAZZO_FAILURE_ACTION_FIELD_STEP_ID_TYPE | step-id--type | stepId must be a string |
| ARAZZO_FAILURE_ACTION_FIELD_RETRY_AFTER_TYPE | retry-after--type | retryAfter must be a number |
| ARAZZO_FAILURE_ACTION_FIELD_RETRY_AFTER_NON_NEGATIVE | retry-after--non-negative | retryAfter must be >= 0 |
| ARAZZO_FAILURE_ACTION_FIELD_RETRY_LIMIT_TYPE | retry-limit--type | retryLimit must be a number |
| ARAZZO_FAILURE_ACTION_FIELD_RETRY_LIMIT_NON_NEGATIVE | retry-limit--non-negative | retryLimit must be a non-negative integer |
| ARAZZO_FAILURE_ACTION_FIELD_CRITERIA_TYPE | criteria--type | criteria array of criterion |
| ARAZZO_FAILURE_ACTION_FIELD_WORKFLOW_ID_MUTUALLY_EXCLUSIVE | workflow-id--mutually-exclusive | workflowId is mutually exclusive with stepId |
| ARAZZO_FAILURE_ACTION_FIELD_STEP_ID_MUTUALLY_EXCLUSIVE | step-id--mutually-exclusive | stepId is mutually exclusive with workflowId |
| ARAZZO_FAILURE_ACTION_FIELD_RETRY_AFTER_ONLY_RETRY | retry-after--only-retry | retryAfter only applies when type is "retry" |
| ARAZZO_FAILURE_ACTION_FIELD_RETRY_LIMIT_ONLY_RETRY | retry-limit--only-retry | retryLimit only applies when type is "retry" |
| NOT_ALLOWED_FIELDS | allowed-fields | Allowed fields + x- |
| ARAZZO_FAILURE_ACTION_FIELD_WORKFLOW_ID_RESOLVED | workflow-id--resolved | workflowId must reference existing workflow |
| ARAZZO_FAILURE_ACTION_FIELD_STEP_ID_RESOLVED | step-id--resolved | stepId must reference existing step in same workflow |

## Components Object (target: `components`)

| Code | Rule File | Description |
|------|-----------|-------------|
| ARAZZO_COMPONENTS_FIELD_INPUTS_TYPE | inputs--type | inputs must be an object |
| ARAZZO_COMPONENTS_FIELD_INPUTS_VALUES_TYPE | inputs--values-type | inputs values must be JSONSchema |
| ARAZZO_COMPONENTS_FIELD_INPUTS_KEYS_PATTERN | inputs--keys-pattern | inputs keys match [a-zA-Z0-9.\-_]+ |
| ARAZZO_COMPONENTS_FIELD_PARAMETERS_TYPE | parameters--type | parameters must be an object |
| ARAZZO_COMPONENTS_FIELD_PARAMETERS_VALUES_TYPE | parameters--values-type | parameters values must be parameter |
| ARAZZO_COMPONENTS_FIELD_PARAMETERS_KEYS_PATTERN | parameters--keys-pattern | parameters keys match [a-zA-Z0-9.\-_]+ |
| ARAZZO_COMPONENTS_FIELD_SUCCESS_ACTIONS_TYPE | success-actions--type | successActions must be an object |
| ARAZZO_COMPONENTS_FIELD_SUCCESS_ACTIONS_VALUES_TYPE | success-actions--values-type | successActions values must be successAction |
| ARAZZO_COMPONENTS_FIELD_SUCCESS_ACTIONS_KEYS_PATTERN | success-actions--keys-pattern | successActions keys match [a-zA-Z0-9.\-_]+ |
| ARAZZO_COMPONENTS_FIELD_FAILURE_ACTIONS_TYPE | failure-actions--type | failureActions must be an object |
| ARAZZO_COMPONENTS_FIELD_FAILURE_ACTIONS_VALUES_TYPE | failure-actions--values-type | failureActions values must be failureAction |
| ARAZZO_COMPONENTS_FIELD_FAILURE_ACTIONS_KEYS_PATTERN | failure-actions--keys-pattern | failureActions keys match [a-zA-Z0-9.\-_]+ |
| NOT_ALLOWED_FIELDS | allowed-fields | Only inputs, parameters, successActions, failureActions + x- |

## Criterion Object (target: `criterion`)

| Code | Rule File | Description |
|------|-----------|-------------|
| ARAZZO_CRITERION_FIELD_CONDITION_REQUIRED | condition--required | condition required |
| ARAZZO_CRITERION_FIELD_CONDITION_TYPE | condition--type | condition must be a string |
| ARAZZO_CRITERION_FIELD_CONTEXT_TYPE | context--type | context must be a string |
| ARAZZO_CRITERION_FIELD_TYPE_EQUALS | type--equals | type must be simple/regex/jsonpath/xpath (when string) |
| ARAZZO_CRITERION_FIELD_CONTEXT_REQUIRED_WHEN_TYPE | context--required-when-type | context MUST be provided when type is specified |
| NOT_ALLOWED_FIELDS | allowed-fields | Only context, condition, type + x- |
| ARAZZO_CRITERION_FIELD_CONTEXT_RUNTIME_EXPRESSION | context--runtime-expression | context must be a valid Runtime Expression |
| ARAZZO_CRITERION_FIELD_CONDITION_REGEX_VALID | condition--regex-valid | condition must be valid regex when type is "regex" |

## Criterion Expression Type Object (target: `criterionExpressionType`)

| Code | Rule File | Description |
|------|-----------|-------------|
| ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_TYPE_REQUIRED | type--required | type required |
| ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_TYPE_TYPE | type--type | type must be a string |
| ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_TYPE_EQUALS | type--equals | type must be jsonpath or xpath |
| ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_VERSION_REQUIRED | version--required | version required |
| ARAZZO_CRITERION_EXPRESSION_TYPE_FIELD_VERSION_TYPE | version--type | version must be a string |
| NOT_ALLOWED_FIELDS | allowed-fields | Only type, version + x- |

## Request Body Object (target: `requestBody`)

| Code | Rule File | Description |
|------|-----------|-------------|
| ARAZZO_REQUEST_BODY_FIELD_CONTENT_TYPE_TYPE | content-type--type | contentType must be a string |
| ARAZZO_REQUEST_BODY_FIELD_REPLACEMENTS_TYPE | replacements--type | replacements array of payloadReplacement |
| NOT_ALLOWED_FIELDS | allowed-fields | Only contentType, payload, replacements + x- |
| ARAZZO_REQUEST_BODY_FIELD_CONTENT_TYPE_FORMAT | content-type--format | contentType should be a valid MIME type (warning) |

## Payload Replacement Object (target: `payloadReplacement`)

| Code | Rule File | Description |
|------|-----------|-------------|
| ARAZZO_PAYLOAD_REPLACEMENT_FIELD_TARGET_REQUIRED | target--required | target required |
| ARAZZO_PAYLOAD_REPLACEMENT_FIELD_TARGET_TYPE | target--type | target must be a string |
| ARAZZO_PAYLOAD_REPLACEMENT_FIELD_VALUE_REQUIRED | value--required | value required |
| NOT_ALLOWED_FIELDS | allowed-fields | Only target, value + x- |

## Reusable Object (target: `reusable`)

| Code | Rule File | Description |
|------|-----------|-------------|
| ARAZZO_REUSABLE_FIELD_REFERENCE_REQUIRED | reference--required | reference required |
| ARAZZO_REUSABLE_FIELD_REFERENCE_TYPE | reference--type | reference must be a string |
| ARAZZO_REUSABLE_FIELD_VALUE_TYPE | value--type | value must be a string |
| NOT_ALLOWED_FIELDS | allowed-fields | Only reference, value (NO extensions) |

## JSON Schema Rules (target: `JSONSchema`) - [SpecLynx ApiDOM Language Service](https://www.npmjs.com/package/@speclynx/apidom-ls)

| Code | Description |
|------|-------------|
| NOT_ALLOWED_FIELDS | JSON Schema 2020-12 keyword allowlist |
| SCHEMA_ID | $id must be a valid URI |
| SCHEMA_REF | $ref must be a valid URI-reference |
| SCHEMA_ADDITIONALITEMS | additionalItems must be a schema object |
| SCHEMA_ADDITIONALITEMS_NONARRAY | additionalItems warns on non-array type |
| SCHEMA_ADDITIONALPROPERTIES | additionalProperties must be a schema object |
| SCHEMA_ADDITIONALPROPERTIES_NONOBJECT | additionalProperties warns on non-object type |
| SCHEMA_ALLOF | allOf must be an array of schemas |
| SCHEMA_ANYOF | anyOf must be an array of schemas |
| SCHEMA_CONTAINS | contains must be a schema object |
| SCHEMA_CONTAINS_NONARRAY | contains warns on non-array type |
| SCHEMA_DEPRECATED | deprecated must be a boolean |
| SCHEMA_DESCRIPTION | description must be a string |
| SCHEMA_ELSE | else must be a schema object |
| SCHEMA_ELSE_NONIF | else warns without if |
| SCHEMA_ENUM | enum values must be unique |
| SCHEMA_EXAMPLES | examples must be an array |
| SCHEMA_EXCLUSIVEMAXIMUM | exclusiveMaximum must be a number (2020-12) |
| SCHEMA_EXCLUSIVEMAXIMUM | exclusiveMaximum boolean (draft-04 compat) |
| SCHEMA_EXCLUSIVEMINUMUM | exclusiveMinimum must be a number (2020-12) |
| SCHEMA_EXCLUSIVEMINUMUM | exclusiveMinimum boolean (draft-04 compat) |
| SCHEMA_FORMAT | format must be a string |
| SCHEMA_IF | if must be a schema object |
| SCHEMA_IF_NONTHEN | if warns without then |
| SCHEMA_ITEMS | items must be a schema object |
| SCHEMA_ITEMS_NONARRAY | items warns on non-array type |
| SCHEMA_MAXITEMS | maxItems must be a non-negative integer |
| SCHEMA_MAXITEMS_NONARRAY | maxItems warns on non-array type |
| SCHEMA_MAXLENGTH | maxLength must be a non-negative integer |
| SCHEMA_MAXLENGTH_NONSTRING | maxLength warns on non-string type |
| SCHEMA_MAXIMUM | maximum must be a number |
| SCHEMA_MINITEMS | minItems must be a non-negative integer |
| SCHEMA_MINITEMS_NONARRAY | minItems warns on non-array type |
| SCHEMA_MINLENGTH | minLength must be a non-negative integer |
| SCHEMA_MINLENGTH_NONSTRING | minLength warns on non-string type |
| SCHEMA_MINPROPERTIES | minProperties must be a non-negative integer |
| SCHEMA_MINPROPERTIES_NONOBJECT | minProperties warns on non-object type |
| SCHEMA_MAXPROPERTIES | maxProperties must be a non-negative integer |
| SCHEMA_MAXPROPERTIES_NONOBJECT | maxProperties warns on non-object type |
| SCHEMA_MINUMUM | minimum must be a number |
| SCHEMA_MISSING_CORE_FIELDS | Hint when object has no schema keywords |
| SCHEMA_MULTIPLEOF | multipleOf must be a number > 0 |
| SCHEMA_NOT | not must be a schema object |
| SCHEMA_ONEOF | oneOf must be an array of schemas |
| SCHEMA_PATTERN | pattern must be a string |
| SCHEMA_PATTERNPROPERTIES_KEY | patternProperties keys must be valid regexps |
| SCHEMA_PATTERNPROPERTIES_NONOBJECT | patternProperties warns on non-object type |
| SCHEMA_PATTERNPROPERTIES | patternProperties must be an object |
| SCHEMA_PATTERNPROPERTIES_OBJECT | patternProperties values must be schemas |
| SCHEMA_PROPERTIES | properties must be an object |
| SCHEMA_PROPERTIES_OBJECT | properties values must be schemas |
| SCHEMA_PROPERTIES_NONOBJECT | properties warns on non-object type |
| SCHEMA_PROPERTYNAMES | propertyNames must be a schema object |
| SCHEMA_PROPERTYNAMES_NONOBJECT | propertyNames warns on non-object type |
| SCHEMA_READONLY | readOnly must be a boolean |
| SCHEMA_REQUIRED | required must be an array |
| SCHEMA_REQUIRED_NONOBJECT | required warns on non-object type |
| SCHEMA_REQUIRED_WITHOUT_PROPERTIES | required warns without properties |
| SCHEMA_THEN | then must be a schema object |
| SCHEMA_THEN_NONIF | then warns without if |
| SCHEMA_TITLE | title must be a string |
| SCHEMA_TYPE | type must be a string |
| SCHEMA_TYPE | type must be a valid JSON Schema type |
| SCHEMA_UNIQUEITEMS | uniqueItems must be a boolean |
| SCHEMA_UNIQUEITEMS_NONARRAY | uniqueItems warns on non-array type |
| SCHEMA_WRITEONLY | writeOnly must be a boolean |
| SCHEMA_EXAMPLE_DEPRECATED | example deprecated in favor of examples |
| SCHEMA_TYPE_ARRAY_NON_ITEMS | type: array requires items field |
| JSON_SCHEMA_2020_12_KEYWORD_$ID_FORMAT_URI | $id must be valid URI-reference |
| JSON_SCHEMA_2020_12_KEYWORD_$SCHEMA_FORMAT_URI | $schema must be valid URI with scheme |
| JSON_SCHEMA_2020_12_KEYWORD_$REF_FORMAT_URI | $ref must be valid URI-reference |
| JSON_SCHEMA_2020_12_KEYWORD_$COMMENT_TYPE | $comment must be a string |
