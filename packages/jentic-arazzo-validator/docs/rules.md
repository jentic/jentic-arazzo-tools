# Validation rules

Complete reference of all semantic validation and linting rules.
Each rule has a numeric code that appears in [Diagnostic](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#diagnostic) objects returned by `validateURI()` and `validate()`.

## General rules

| Code | Severity | Description |
|------|----------|-------------|
| 14999 | error | duplicate keys in object |
| 15000 | error | object includes not allowed fields |
| 9040600 | error | no `<script>` tags in description/title fields |

## Info Object

| Code | Severity | Description |
|------|----------|-------------|
| 9030200 | error | `title` field is required |
| 9030201 | error | `title` must be a string |
| 9030100 | error | `description` must be a string |
| 9030101 | warning | `description` should be present |
| 9030400 | error | `summary` must be a string |
| 9030401 | hint | `summary` is recommended |
| 9030300 | error | `version` field is required |
| 9030301 | error | `version` must be a string |
| 15000 | error | only `title`, `description`, `summary`, `version` + `x-` allowed |

## Arazzo Specification Object

| Code | Severity | Description |
|------|----------|-------------|
| 9040100 | error | `arazzo` version field is required |
| 9040101 | error | `arazzo` must be a string |
| 9040102 | error | `arazzo` must match `^1\.0\.\d+(-.+)?$` |
| 9040200 | error | `info` field is required |
| 9040201 | error | `info` must be an Info object |
| 9040300 | error | `sourceDescriptions` is required |
| 9040301 | error | `sourceDescriptions` must be an array of Source Description objects |
| 9040302 | error | `sourceDescriptions` must have at least one entry |
| 9040400 | error | `workflows` is required |
| 9040401 | error | `workflows` must be an array of Workflow objects |
| 9040402 | error | `workflows` must have at least one entry |
| 9040500 | error | `components` must be a Components object |
| 15000 | error | only `arazzo`, `info`, `sourceDescriptions`, `workflows`, `components` + `x-` allowed |

## Source Description Object

| Code | Severity | Description |
|------|----------|-------------|
| 9050100 | error | `name` field is required |
| 9050101 | error | `name` must be a string |
| 9050102 | error | `name` must match `[A-Za-z0-9_\-]+` |
| 9050200 | error | `url` field is required |
| 9050201 | error | `url` must be a string |
| 9050300 | error | `type` must be a string |
| 9050301 | error | `type` must be `openapi` or `arazzo` |
| 15000 | error | only `name`, `url`, `type` + `x-` allowed |

## Workflow Object

| Code | Severity | Description |
|------|----------|-------------|
| 9060100 | error | `workflowId` is required |
| 9060101 | error | `workflowId` must be a string |
| 9060102 | error | `workflowId` must match `[A-Za-z0-9_\-]+` |
| 9060103 | error | `workflowId` must be unique across all workflows |
| 9060200 | error | `summary` must be a string |
| 9060203 | hint | `summary` is recommended |
| 9060201 | error | `description` must be a string |
| 9060202 | warning | `description` should be present |
| 9060300 | error | `inputs` must be a JSON Schema object |
| 9060400 | error | `steps` is required |
| 9060401 | error | `steps` must be an array of Step objects |
| 9060402 | error | `steps` must have at least one entry |
| 9060403 | error | `stepId` must be unique within each workflow |
| 9060500 | error | `dependsOn` must be an array of strings |
| 9060501 | error | `dependsOn` entries must be unique |
| 9060502 | error | `dependsOn` entries must resolve to existing workflows |
| 9060600 | error | `successActions` must be an array of Success Action / Reusable objects |
| 9060700 | error | `failureActions` must be an array of Failure Action / Reusable objects |
| 9060800 | error | `outputs` must be an object |
| 9060801 | error | output keys must match `[a-zA-Z0-9.\-_]+` |
| 9060802 | error | output values must be strings |
| 9060803 | error | output names must be unique per workflow |
| 9060804 | error | output values must be valid Runtime Expressions |
| 9060900 | error | `parameters` must be an array of Parameter / Reusable objects |
| 15000 | error | only allowed fields + `x-` |

## Step Object

| Code | Severity | Description |
|------|----------|-------------|
| 9070100 | error | `stepId` is required |
| 9070101 | error | `stepId` must be a string |
| 9070102 | error | `stepId` must match `[A-Za-z0-9_\-]+` |
| 9070200 | error | `description` must be a string |
| 9070201 | warning | `description` should be present |
| 9070300 | error | `operationId` must be a string |
| 9070301 | error | `operationPath` must be a string |
| 9070302 | error | `workflowId` must be a string |
| 9070303 | hint | prefer `operationId` over `operationPath` |
| 9070304 | error | `workflowId` must reference an existing workflow |
| 9071000 | error | `operationId` is mutually exclusive with `operationPath` and `workflowId` |
| 9071001 | error | `operationPath` is mutually exclusive with `operationId` and `workflowId` |
| 9071002 | error | `workflowId` is mutually exclusive with `operationId` and `operationPath` |
| 9070400 | error | `requestBody` must be a Request Body object |
| 9070500 | error | `successCriteria` must be an array of Criterion objects |
| 9070600 | error | `onSuccess` must be an array of Success Action / Reusable objects |
| 9070601 | error | success action names must be unique per step |
| 9070700 | error | `onFailure` must be an array of Failure Action / Reusable objects |
| 9070701 | error | failure action names must be unique per step |
| 9070800 | error | `outputs` must be an object |
| 9070801 | error | output keys must match `[a-zA-Z0-9.\-_]+` |
| 9070802 | error | output values must be strings |
| 9070803 | error | output names must be unique per step |
| 9070804 | error | output values must be valid Runtime Expressions |
| 9070900 | error | `parameters` must be an array of Parameter / Reusable objects |
| 9070901 | error | parameters must be unique by `name` + `in` per step |
| 15000 | error | only allowed fields + `x-` |

## Parameter Object

| Code | Severity | Description |
|------|----------|-------------|
| 9080100 | error | `name` is required |
| 9080101 | error | `name` must be a string |
| 9080200 | error | `in` must be a string |
| 9080201 | error | `in` must be `path`, `query`, `header`, or `cookie` |
| 9080300 | error | `value` is required |
| 9080301 | error | `value` starting with `$` must be a valid Runtime Expression |
| 9070901 | error | parameters must be unique by `name` + `in` |
| 15000 | error | only `name`, `in`, `value` + `x-` allowed |

## Success Action Object

| Code | Severity | Description |
|------|----------|-------------|
| 9090100 | error | `name` is required |
| 9090101 | error | `name` must be a string |
| 9090200 | error | `type` is required |
| 9090201 | error | `type` must be a string |
| 9090202 | error | `type` must be `end` or `goto` |
| 9090300 | error | `workflowId` must be a string |
| 9090301 | error | `workflowId` must reference an existing workflow |
| 9090400 | error | `stepId` must be a string |
| 9090401 | error | `stepId` must reference an existing step in the same workflow |
| 9090500 | error | `criteria` must be an array of Criterion objects |
| 9090600 | error | `workflowId` is mutually exclusive with `stepId` |
| 9090601 | error | `stepId` is mutually exclusive with `workflowId` |
| 9070601 | error | success action names must be unique |
| 15000 | error | only allowed fields + `x-` |

## Failure Action Object

| Code | Severity | Description |
|------|----------|-------------|
| 9100100 | error | `name` is required |
| 9100101 | error | `name` must be a string |
| 9100200 | error | `type` is required |
| 9100201 | error | `type` must be a string |
| 9100202 | error | `type` must be `end`, `goto`, or `retry` |
| 9100300 | error | `workflowId` must be a string |
| 9100301 | error | `workflowId` must reference an existing workflow |
| 9100400 | error | `stepId` must be a string |
| 9100401 | error | `stepId` must reference an existing step in the same workflow |
| 9100500 | error | `retryAfter` must be a number |
| 9100501 | error | `retryAfter` must be >= 0 |
| 9100900 | warning | `retryAfter` only applies when `type` is `retry` |
| 9100600 | error | `retryLimit` must be a number |
| 9100601 | error | `retryLimit` must be a non-negative integer |
| 9100901 | warning | `retryLimit` only applies when `type` is `retry` |
| 9100700 | error | `criteria` must be an array of Criterion objects |
| 9100800 | error | `workflowId` is mutually exclusive with `stepId` |
| 9100801 | error | `stepId` is mutually exclusive with `workflowId` |
| 9070701 | error | failure action names must be unique |
| 15000 | error | only allowed fields + `x-` |

## Components Object

| Code | Severity | Description |
|------|----------|-------------|
| 9110100 | error | `inputs` must be an object |
| 9110101 | error | `inputs` values must be JSON Schema objects |
| 9110102 | error | `inputs` keys must match `[a-zA-Z0-9.\-_]+` |
| 9110200 | error | `parameters` must be an object |
| 9110201 | error | `parameters` values must be Parameter objects |
| 9110202 | error | `parameters` keys must match `[a-zA-Z0-9.\-_]+` |
| 9110300 | error | `successActions` must be an object |
| 9110301 | error | `successActions` values must be Success Action objects |
| 9110302 | error | `successActions` keys must match `[a-zA-Z0-9.\-_]+` |
| 9110400 | error | `failureActions` must be an object |
| 9110401 | error | `failureActions` values must be Failure Action objects |
| 9110402 | error | `failureActions` keys must match `[a-zA-Z0-9.\-_]+` |
| 15000 | error | only `inputs`, `parameters`, `successActions`, `failureActions` + `x-` allowed |

## Criterion Object

| Code | Severity | Description |
|------|----------|-------------|
| 9120100 | error | `condition` is required |
| 9120101 | error | `condition` must be a string |
| 9120102 | error | `condition` must be a valid regex when `type` is `regex` |
| 9120200 | error | `context` must be a string |
| 9120201 | error | `context` must be a valid Runtime Expression |
| 9120300 | warning | `type` must be `simple`, `regex`, `jsonpath`, or `xpath` (when string) |
| 9120400 | error | `context` must be provided when `type` is specified |
| 15000 | error | only `context`, `condition`, `type` + `x-` allowed |

## Criterion Expression Type Object

| Code | Severity | Description |
|------|----------|-------------|
| 9130100 | error | `type` is required |
| 9130101 | error | `type` must be a string |
| 9130102 | error | `type` must be `jsonpath` or `xpath` |
| 9130200 | error | `version` is required |
| 9130201 | error | `version` must be a string |
| 15000 | error | only `type`, `version` + `x-` allowed |

## Request Body Object

| Code | Severity | Description |
|------|----------|-------------|
| 9140100 | error | `contentType` must be a string |
| 9140101 | warning | `contentType` should be a valid MIME type |
| 9140200 | error | `replacements` must be an array of Payload Replacement objects |
| 15000 | error | only `contentType`, `payload`, `replacements` + `x-` allowed |

## Payload Replacement Object

| Code | Severity | Description |
|------|----------|-------------|
| 9150100 | error | `target` is required |
| 9150101 | error | `target` must be a string |
| 9150200 | error | `value` is required |
| 15000 | error | only `target`, `value` + `x-` allowed |

## Reusable Object

| Code | Severity | Description |
|------|----------|-------------|
| 9160100 | error | `reference` is required |
| 9160101 | error | `reference` must be a string |
| 9160200 | error | `value` must be a string |
| 15000 | error | only `reference`, `value` allowed (no extensions) |

## JSON Schema rules

JSON Schema 2020-12 validation rules are provided by [SpecLynx ApiDOM Language Service](https://www.npmjs.com/package/@speclynx/apidom-ls).
