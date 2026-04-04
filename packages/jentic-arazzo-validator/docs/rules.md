# Validation rules

Complete reference of all semantic validation and linting rules.
Each rule has a numeric code that appears in [Diagnostic](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#diagnostic) objects returned by `validateURI()` and `validate()`.

## General rules

| Code | Severity | Description |
|------|----------|-------------|
| 9000001 | error | document content is not recognized as an Arazzo Specification |
| 14999 | error | duplicate keys in object |
| 15000 | error | object includes not allowed fields |
| 9020600 | error | no `<script>` tags in description/title fields |

## Info Object

| Code | Severity | Description |
|------|----------|-------------|
| 9010200 | error | `title` field is required |
| 9010201 | error | `title` must be a string |
| 9010100 | error | `description` must be a string |
| 9010101 | warning | `description` should be present |
| 9010400 | error | `summary` must be a string |
| 9010401 | hint | `summary` is recommended |
| 9010300 | error | `version` field is required |
| 9010301 | error | `version` must be a string |
| 15000 | error | only `title`, `description`, `summary`, `version` + `x-` allowed |

## Arazzo Specification Object

| Code | Severity | Description |
|------|----------|-------------|
| 9020100 | error | `arazzo` version field is required |
| 9020101 | error | `arazzo` must be a string |
| 9020102 | error | `arazzo` must match `^1\.0\.\d+(-.+)?$` |
| 9020200 | error | `info` field is required |
| 9020201 | error | `info` must be an Info object |
| 9020300 | error | `sourceDescriptions` is required |
| 9020301 | error | `sourceDescriptions` must be an array of Source Description objects |
| 9020302 | error | `sourceDescriptions` must have at least one entry |
| 9020400 | error | `workflows` is required |
| 9020401 | error | `workflows` must be an array of Workflow objects |
| 9020402 | error | `workflows` must have at least one entry |
| 9020500 | error | `components` must be a Components object |
| 15000 | error | only `arazzo`, `info`, `sourceDescriptions`, `workflows`, `components` + `x-` allowed |

## Source Description Object

| Code | Severity | Description |
|------|----------|-------------|
| 9030100 | error | `name` field is required |
| 9030101 | error | `name` must be a string |
| 9030102 | error | `name` must match `[A-Za-z0-9_\-]+` |
| 9030200 | error | `url` field is required |
| 9030201 | error | `url` must be a string |
| 9030300 | error | `type` must be a string |
| 9030301 | error | `type` must be `openapi` or `arazzo` |
| 15000 | error | only `name`, `url`, `type` + `x-` allowed |

## Workflow Object

| Code | Severity | Description |
|------|----------|-------------|
| 9040100 | error | `workflowId` is required |
| 9040101 | error | `workflowId` must be a string |
| 9040102 | error | `workflowId` must match `[A-Za-z0-9_\-]+` |
| 9040103 | error | `workflowId` must be unique across all workflows |
| 9040200 | error | `summary` must be a string |
| 9040203 | hint | `summary` is recommended |
| 9040201 | error | `description` must be a string |
| 9040202 | warning | `description` should be present |
| 9040300 | error | `inputs` must be a JSON Schema object |
| 9040400 | error | `steps` is required |
| 9040401 | error | `steps` must be an array of Step objects |
| 9040402 | error | `steps` must have at least one entry |
| 9040403 | error | `stepId` must be unique within each workflow |
| 9040500 | error | `dependsOn` must be an array of strings |
| 9040501 | error | `dependsOn` entries must be unique |
| 9040502 | error | `dependsOn` entries must resolve to existing workflows |
| 9040600 | error | `successActions` must be an array of Success Action / Reusable objects |
| 9040700 | error | `failureActions` must be an array of Failure Action / Reusable objects |
| 9040800 | error | `outputs` must be an object |
| 9040801 | error | output keys must match `[a-zA-Z0-9.\-_]+` |
| 9040802 | error | output values must be strings |
| 9040803 | error | output names must be unique per workflow |
| 9040804 | error | output values must be valid Runtime Expressions |
| 9040900 | error | `parameters` must be an array of Parameter / Reusable objects |
| 15000 | error | only allowed fields + `x-` |

## Step Object

| Code | Severity | Description |
|------|----------|-------------|
| 9050100 | error | `stepId` is required |
| 9050101 | error | `stepId` must be a string |
| 9050102 | error | `stepId` must match `[A-Za-z0-9_\-]+` |
| 9050200 | error | `description` must be a string |
| 9050201 | warning | `description` should be present |
| 9050300 | error | `operationId` must be a string |
| 9050301 | error | `operationPath` must be a string |
| 9050302 | error | `workflowId` must be a string |
| 9050303 | hint | prefer `operationId` over `operationPath` |
| 9050304 | error | `workflowId` must reference an existing workflow |
| 9051000 | error | `operationId` is mutually exclusive with `operationPath` and `workflowId` |
| 9051001 | error | `operationPath` is mutually exclusive with `operationId` and `workflowId` |
| 9051002 | error | `workflowId` is mutually exclusive with `operationId` and `operationPath` |
| 9050400 | error | `requestBody` must be a Request Body object |
| 9050500 | error | `successCriteria` must be an array of Criterion objects |
| 9050600 | error | `onSuccess` must be an array of Success Action / Reusable objects |
| 9050601 | error | success action names must be unique per step |
| 9050700 | error | `onFailure` must be an array of Failure Action / Reusable objects |
| 9050701 | error | failure action names must be unique per step |
| 9050800 | error | `outputs` must be an object |
| 9050801 | error | output keys must match `[a-zA-Z0-9.\-_]+` |
| 9050802 | error | output values must be strings |
| 9050803 | error | output names must be unique per step |
| 9050804 | error | output values must be valid Runtime Expressions |
| 9050900 | error | `parameters` must be an array of Parameter / Reusable objects |
| 9050901 | error | parameters must be unique by `name` + `in` per step |
| 15000 | error | only allowed fields + `x-` |

## Parameter Object

| Code | Severity | Description |
|------|----------|-------------|
| 9060100 | error | `name` is required |
| 9060101 | error | `name` must be a string |
| 9060200 | error | `in` must be a string |
| 9060201 | error | `in` must be `path`, `query`, `header`, or `cookie` |
| 9060300 | error | `value` is required |
| 9060301 | error | `value` starting with `$` must be a valid Runtime Expression |
| 9050901 | error | parameters must be unique by `name` + `in` |
| 15000 | error | only `name`, `in`, `value` + `x-` allowed |

## Success Action Object

| Code | Severity | Description |
|------|----------|-------------|
| 9070100 | error | `name` is required |
| 9070101 | error | `name` must be a string |
| 9070200 | error | `type` is required |
| 9070201 | error | `type` must be a string |
| 9070202 | error | `type` must be `end` or `goto` |
| 9070300 | error | `workflowId` must be a string |
| 9070301 | error | `workflowId` must reference an existing workflow |
| 9070400 | error | `stepId` must be a string |
| 9070401 | error | `stepId` must reference an existing step in the same workflow |
| 9070500 | error | `criteria` must be an array of Criterion objects |
| 9070600 | error | `workflowId` is mutually exclusive with `stepId` |
| 9070601 | error | `stepId` is mutually exclusive with `workflowId` |
| 9050601 | error | success action names must be unique |
| 15000 | error | only allowed fields + `x-` |

## Failure Action Object

| Code | Severity | Description |
|------|----------|-------------|
| 9080100 | error | `name` is required |
| 9080101 | error | `name` must be a string |
| 9080200 | error | `type` is required |
| 9080201 | error | `type` must be a string |
| 9080202 | error | `type` must be `end`, `goto`, or `retry` |
| 9080300 | error | `workflowId` must be a string |
| 9080301 | error | `workflowId` must reference an existing workflow |
| 9080400 | error | `stepId` must be a string |
| 9080401 | error | `stepId` must reference an existing step in the same workflow |
| 9080500 | error | `retryAfter` must be a number |
| 9080501 | error | `retryAfter` must be >= 0 |
| 9080900 | warning | `retryAfter` only applies when `type` is `retry` |
| 9080600 | error | `retryLimit` must be a number |
| 9080601 | error | `retryLimit` must be a non-negative integer |
| 9080901 | warning | `retryLimit` only applies when `type` is `retry` |
| 9080700 | error | `criteria` must be an array of Criterion objects |
| 9080800 | error | `workflowId` is mutually exclusive with `stepId` |
| 9080801 | error | `stepId` is mutually exclusive with `workflowId` |
| 9050701 | error | failure action names must be unique |
| 15000 | error | only allowed fields + `x-` |

## Components Object

| Code | Severity | Description |
|------|----------|-------------|
| 9090100 | error | `inputs` must be an object |
| 9090101 | error | `inputs` values must be JSON Schema objects |
| 9090102 | error | `inputs` keys must match `[a-zA-Z0-9.\-_]+` |
| 9090200 | error | `parameters` must be an object |
| 9090201 | error | `parameters` values must be Parameter objects |
| 9090202 | error | `parameters` keys must match `[a-zA-Z0-9.\-_]+` |
| 9090300 | error | `successActions` must be an object |
| 9090301 | error | `successActions` values must be Success Action objects |
| 9090302 | error | `successActions` keys must match `[a-zA-Z0-9.\-_]+` |
| 9090400 | error | `failureActions` must be an object |
| 9090401 | error | `failureActions` values must be Failure Action objects |
| 9090402 | error | `failureActions` keys must match `[a-zA-Z0-9.\-_]+` |
| 15000 | error | only `inputs`, `parameters`, `successActions`, `failureActions` + `x-` allowed |

## Criterion Object

| Code | Severity | Description |
|------|----------|-------------|
| 9100100 | error | `condition` is required |
| 9100101 | error | `condition` must be a string |
| 9100102 | error | `condition` must be a valid regex when `type` is `regex` |
| 9100200 | error | `context` must be a string |
| 9100201 | error | `context` must be a valid Runtime Expression |
| 9100300 | warning | `type` must be `simple`, `regex`, `jsonpath`, or `xpath` (when string) |
| 9100400 | error | `context` must be provided when `type` is specified |
| 15000 | error | only `context`, `condition`, `type` + `x-` allowed |

## Criterion Expression Type Object

| Code | Severity | Description |
|------|----------|-------------|
| 9110100 | error | `type` is required |
| 9110101 | error | `type` must be a string |
| 9110102 | error | `type` must be `jsonpath` or `xpath` |
| 9110200 | error | `version` is required |
| 9110201 | error | `version` must be a string |
| 15000 | error | only `type`, `version` + `x-` allowed |

## Request Body Object

| Code | Severity | Description |
|------|----------|-------------|
| 9120100 | error | `contentType` must be a string |
| 9120101 | warning | `contentType` should be a valid MIME type |
| 9120200 | error | `replacements` must be an array of Payload Replacement objects |
| 15000 | error | only `contentType`, `payload`, `replacements` + `x-` allowed |

## Payload Replacement Object

| Code | Severity | Description |
|------|----------|-------------|
| 9130100 | error | `target` is required |
| 9130101 | error | `target` must be a string |
| 9130200 | error | `value` is required |
| 15000 | error | only `target`, `value` + `x-` allowed |

## Reusable Object

| Code | Severity | Description |
|------|----------|-------------|
| 9140100 | error | `reference` is required |
| 9140101 | error | `reference` must be a string |
| 9140200 | error | `value` must be a string |
| 15000 | error | only `reference`, `value` allowed (no extensions) |

## JSON Schema rules

JSON Schema 2020-12 validation rules are provided by [SpecLynx ApiDOM Language Service](https://www.npmjs.com/package/@speclynx/apidom-ls).
