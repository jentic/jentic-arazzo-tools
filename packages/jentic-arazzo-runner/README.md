# @jentic/arazzo-runner

> [!WARNING]
> This package is under heavy development. APIs may change without notice.

`@jentic/arazzo-runner` executes [Arazzo Specification](https://spec.openapis.org/arazzo/latest.html) workflows against live APIs described by [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) source descriptions.
It builds on [SpecLynx ApiDOM](https://github.com/speclynx/apidom) data models and reuses the loading, resolution, and normalization primitives shared across [`@jentic/arazzo-parser`](https://www.npmjs.com/package/@jentic/arazzo-parser) and [`@jentic/arazzo-resolver`](https://www.npmjs.com/package/@jentic/arazzo-resolver).

**Supported Arazzo versions:**

- [Arazzo 1.0.0](https://spec.openapis.org/arazzo/v1.0.0)
- [Arazzo 1.0.1](https://spec.openapis.org/arazzo/v1.0.1)

**Supported OpenAPI versions (for source descriptions):**

- [OpenAPI 2.0](https://spec.openapis.org/oas/v2.0)
- [OpenAPI 3.0.x](https://spec.openapis.org/oas/v3.0.4)
- [OpenAPI 3.1.x](https://spec.openapis.org/oas/v3.1.2)

## Installation

> [!NOTE]
> This package is not yet published to npm. It is developed within the [`jentic-arazzo-tools`](https://github.com/jentic/jentic-arazzo-tools) monorepo and will be publicly installable once its API stabilizes.

## Architecture

Running an Arazzo workflow is a pipeline of small, single-responsibility building blocks organized into four main components:

- **`DocumentRegistry`** — loads and caches the Arazzo entry document and its OpenAPI source descriptions, so each is fetched and parsed once.
- **`WorkflowExecutor`** — iterates a workflow's steps, owns the run state, and interprets control-flow actions (`goto`, `retry`, `end`).
- **`StepExecutor`** — runs a single Arazzo step: locates its operation, resolves inputs, evaluates criteria and outputs, and selects the next action.
- **`OpenAPIOperationExecutor`** — runs a single OpenAPI operation and returns its raw response; the Arazzo-agnostic seam between the runner and any `OpenAPIClient`.

```mermaid
flowchart TD
    Registry[("DocumentRegistry<br/><i>load & cache documents</i>")]

    WF["WorkflowExecutor<br/>iterate steps · own state · control flow"]
    Step["StepExecutor<br/>run one Arazzo step"]
    Op["OpenAPIOperationExecutor<br/>run one OpenAPI operation"]
    Client["OpenAPIClient<br/>execute against the live API"]

    WF -->|"execute(step, state)"| Step
    Step -->|"execute(locator, options)"| Op
    Op -->|"clientFactory(document)"| Client

    Registry -.->|documents| WF
    Registry -.->|documents| Step
    Registry -.->|documents| Op

    %% brand colors: Arazzo green, OpenAPI green, neutral registry grey
    classDef arazzo fill:#94C83D,stroke:#6BA543,stroke-width:1px,color:#231F20;
    classDef openapi fill:#6BA543,stroke:#4D5A31,color:#fff;
    classDef neutral fill:#424143,stroke:#231F20,color:#fff;

    class WF,Step arazzo;
    class Op,Client openapi;
    class Registry neutral;
```

Each layer reads run state but never mutates it — the `WorkflowExecutor` is the single writer that records outputs and interprets the returned control-flow action.

## `OpenAPIOperationExecutor`

Executes a single OpenAPI operation and returns its raw response. It is **Arazzo-agnostic**: it neither locates the operation nor resolves runtime expressions. Given a canonical locator (`{ document, jsonPointer }`) it extracts the operation from its owning document, normalizes it, assembles a minimal standalone OpenAPI document containing just that operation, builds a client for the assembled document, and executes it.

`OpenAPIOperationExecutor` is the seam between the runner and any OpenAPI client implementation. It builds its client through the injected `clientFactory`, so a different HTTP stack (or a deterministic stub in tests) can be dropped in without touching the runner.

```js
import {
  DocumentRegistry,
  OpenAPIOperationLocatorNormalizer,
  OpenAPIOperationExecutor,
  OpenAPIClientSwagger,
} from '@jentic/arazzo-runner';

const registry = new DocumentRegistry();
const arazzoDoc = await registry.acquireEntryDocument('https://example.com/workflow.arazzo.yaml');

// resolve a step's operationId to a canonical { document, jsonPointer } locator.
const locator = await new OpenAPIOperationLocatorNormalizer(registry).normalizeOperationId(
  'findPetsByStatus',
  arazzoDoc,
);

const executor = new OpenAPIOperationExecutor({
  clientFactory: (document) => new OpenAPIClientSwagger(document),
});

const response = await executor.execute(locator, {
  parameters: { status: 'available' },
  contextUrl: 'https://petstore3.swagger.io',
});

console.log(response.status, response.body);
```

### Options

```ts
new OpenAPIOperationExecutor({
  clientFactory, // (document: OpenAPIDocument) => OpenAPIClient  — required
  operationExtractor, // optional; defaults to a fresh OpenAPIOperationExtractor
  operationNormalizer, // optional; defaults to a fresh OpenAPIOperationNormalizer
  documentAssembler, // optional; defaults to a fresh OpenAPIDocumentAssembler
});
```

### `execute(locator, executeOptions?)`

- **`locator`** — a canonical `OpenAPIOperationLocator` (`{ document, jsonPointer }`), typically produced by `OpenAPIOperationLocatorNormalizer`.
- **`executeOptions`** — an opaque bag of client execute options (e.g. resolved `parameters`, a `requestBody` and its `requestContentType`, or a swagger client's `contextUrl`). The **operation target always takes precedence** over this bag: the locator's JSON Pointer is forced as `operationPath` and `operationId` is cleared, so a caller-supplied `executeOptions.operationPath` / `.operationId` cannot hijack which operation runs.

Returns an `OpenAPIOperationResponse` (`ok`, `status`, `statusText`, `headers`, `body`, `text`, and the sent `request`). A non-2xx response is returned as data, not thrown — whether it counts as success is judged by the step's `successCriteria`. Only malformed input (an unlocatable operation, an unsupported OpenAPI version) throws.

## `StepExecutor`

Executes a single Arazzo step that invokes an OpenAPI operation, returning its outcome. It orchestrates the full per-step pipeline:

1. locate the step's operation (`operationId` or `operationPath`);
2. resolve the step's `parameters` and `requestBody` against the pre-request context (`$inputs`, `$steps.*.outputs`, …);
3. delegate the call to `OpenAPIOperationExecutor`;
4. evaluate `successCriteria`, resolve `outputs`, and select the `onSuccess` / `onFailure` action against the post-request context (`$statusCode`, `$response.*`, `$request.*`, `$url`, `$method`).

`StepExecutor` **reads run state and mutates nothing** — it returns the resolved outputs and the selected action for the caller to record and interpret. A step targeting a `workflowId` (a sub-workflow) is not an operation step and throws; running sub-workflows is a future `WorkflowExecutor`'s concern.

```js
import {
  DocumentRegistry,
  WorkflowExecutionState,
  StepExecutor,
  OpenAPIClientSwagger,
} from '@jentic/arazzo-runner';
import { refractStep } from '@speclynx/apidom-ns-arazzo-1';

const registry = new DocumentRegistry();
const arazzoDoc = await registry.acquireEntryDocument('https://example.com/workflow.arazzo.yaml');

const executor = new StepExecutor({
  document: arazzoDoc,
  registry,
  clientFactory: (document) => new OpenAPIClientSwagger(document),
});

// run state carries $inputs and accumulates $steps.*.outputs across a run.
const state = new WorkflowExecutionState({ inputs: { preferredPetStatus: 'available' } });

const step = refractStep({
  stepId: 'findAvailablePets',
  operationId: 'findPetsByStatus',
  parameters: [{ name: 'status', in: 'query', value: '$inputs.preferredPetStatus' }],
  successCriteria: [{ condition: '$statusCode == 200' }],
  outputs: { pets: '$response.body' },
});

const outcome = await executor.execute(step, state, {
  contextUrl: 'https://petstore3.swagger.io',
});

console.log(outcome.successful); // true when every successCriterion passed
console.log(outcome.outputs); // { pets: [...] } — resolved step outputs
console.log(outcome.action); // the selected onSuccess / onFailure action, or undefined

// a caller records the outputs so a later step can read $steps.findAvailablePets.outputs.pets
state.setStepOutputs(outcome.stepId, outcome.outputs);
```

### Options

```ts
new StepExecutor({
  document, // ArazzoDocument — the entry document the step belongs to
  registry, // DocumentRegistry — holds the already-loaded source documents
  clientFactory, // (document: OpenAPIDocument) => OpenAPIClient
});
```

### `execute(step, state, executeOptions?)`

- **`step`** — a `StepElement` (from `@speclynx/apidom-ns-arazzo-1`).
- **`state`** — a read-only `ContextSource`; `WorkflowExecutionState` implements it and provides the `$`-expression context.
- **`executeOptions`** — the same opaque client bag forwarded to `OpenAPIOperationExecutor`. The step's resolved `parameters` and `requestBody` take precedence over it, and the operation target takes precedence over everything.

Returns a `StepExecutionResult`:

| Field        | Description                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| `stepId`     | the executed step's id                                                                                  |
| `response`   | the `OpenAPIOperationResponse`                                                                          |
| `successful` | `true` when every `successCriterion` passed (a step with no criteria succeeds on any received response) |
| `outputs`    | the resolved step `outputs`, keyed by name                                                              |
| `action`     | the selected `onSuccess` / `onFailure` action element, or `undefined` when none matched                 |

### Authoring errors vs. failed steps

The two are deliberately distinct:

- A **received response with unmet criteria** is a normal outcome — `successful: false`, no throw.
- **Malformed input** throws an `ExecutionError` (a step with no operation target, more than one mutually-exclusive target, a `workflowId` step, or an operation that cannot be located).

## `DocumentRegistry`

Loads and caches Arazzo and OpenAPI documents, so a source description referenced by many steps is fetched and parsed once.

```js
import { DocumentRegistry } from '@jentic/arazzo-runner';

const registry = new DocumentRegistry();

// the entry Arazzo document.
const arazzoDoc = await registry.acquireEntryDocument('https://example.com/workflow.arazzo.yaml');

// a source description, resolved by name to an absolute URI, then acquired.
const uri = arazzoDoc.resolveSourceDescriptionURI('petstoreAPI');
const openapiDoc = await registry.acquire(uri);

registry.clear(); // drop cached documents to reclaim memory
```

## `WorkflowExecutionState`

Accumulates workflow-scoped run state and produces the context a runtime expression is evaluated against (`$inputs`, `$steps.{id}.outputs`, `$workflows.{id}.{inputs,outputs}`, and the workflow's own `$outputs`). Control-flow position, retries, and traces are the executor's concern, not this state's.

```js
import { WorkflowExecutionState } from '@jentic/arazzo-runner';

const state = new WorkflowExecutionState({ inputs: { userId: 42 } });
state.setStepOutputs('login', { token: 'abc' }); // read later via $steps.login.outputs.token
state.setOutput('finalToken', 'abc'); // read via $outputs.finalToken
```

## Runtime expressions

Steps reference run state and responses through [Arazzo runtime expressions](https://spec.openapis.org/arazzo/latest.html#runtime-expressions). `RuntimeExpressionEvaluator` resolves them against the current context; the supported roots include `$inputs`, `$outputs`, `$steps.*`, `$workflows.*`, `$statusCode`, `$response.*`, `$request.*`, `$url`, `$method`, `$components.*`, and `$sourceDescriptions.*`. Criteria are evaluated by version-aware evaluators (`simple`, `regex`, `jsonpath`, `xpath`).

## Roadmap

`StepExecutor` runs a single step. A stateful `WorkflowExecutor` that iterates a workflow's steps — recording outputs into `WorkflowExecutionState`, interpreting the returned control-flow actions (`goto`, `retry`, `end`), applying workflow-level defaults, and calling sub-workflows — is the next major building block.
