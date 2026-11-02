/**
 * Arazzo Specification v1.0.1 Type Definitions
 * Based on: https://spec.openapis.org/arazzo/latest.html
 */

/** @public */
export interface ArazzoDocument {
  arazzo: string;
  info: InfoObject;
  sourceDescriptions: SourceDescription[];
  workflows: Workflow[];
  components?: ComponentsObject;
}

/** @public */
export interface InfoObject {
  title: string;
  version: string;
  summary?: string;
  description?: string;
}

/** @public */
export interface SourceDescription {
  name: string;
  url: string;
  type?: 'openapi' | 'arazzo';
  /** Internal tracking ID - not part of Arazzo spec, stripped on export */
  _internalId?: string;
}

/** @public */
export interface Workflow {
  workflowId: string;
  summary?: string;
  description?: string;
  inputs?: JSONSchema;
  dependsOn?: string[];
  steps: Step[];
  successActions?: (SuccessAction | ReusableObject)[];
  failureActions?: (FailureAction | ReusableObject)[];
  outputs?: Record<string, string>;
  parameters?: (Parameter | ReusableObject)[];
  /** Internal tracking ID - not part of Arazzo spec, stripped on export */
  _internalId?: string;
}

/** @public */
export interface Step {
  stepId: string;
  description?: string;
  operationId?: string;
  operationPath?: string;
  workflowId?: string;
  parameters?: (Parameter | ReusableObject)[];
  requestBody?: RequestBody;
  successCriteria?: Criterion[];
  onSuccess?: (SuccessAction | ReusableObject)[];
  onFailure?: (FailureAction | ReusableObject)[];
  outputs?: Record<string, string>;
  /** Internal tracking ID - not part of Arazzo spec, stripped on export */
  _internalId?: string;
}

/** @public */
export interface Parameter {
  name: string;
  in?: 'path' | 'query' | 'header' | 'cookie';
  value: any;
}

/** @public */
export interface RequestBody {
  contentType?: string;
  payload?: any;
  replacements?: PayloadReplacement[];
}

/** @public */
export interface PayloadReplacement {
  target: string;
  value: any;
}

/** @public */
export interface SuccessAction {
  name: string;
  type: 'end' | 'goto';
  workflowId?: string;
  stepId?: string;
  criteria?: Criterion[];
}

/** @public */
export interface FailureAction {
  name: string;
  type: 'end' | 'retry' | 'goto';
  workflowId?: string;
  stepId?: string;
  retryAfter?: number;
  retryLimit?: number;
  criteria?: Criterion[];
}

/** @public */
export interface Criterion {
  context?: string;
  condition: string;
  type?: 'simple' | 'regex' | 'jsonpath' | 'xpath' | CriterionExpressionType;
}

/** @public */
export interface CriterionExpressionType {
  type: 'jsonpath' | 'xpath';
  version: string;
}

/** @public */
export interface ReusableObject {
  reference: string;
  value?: string;
}

/** @public */
export interface ComponentsObject {
  inputs?: Record<string, JSONSchema>;
  parameters?: Record<string, Parameter>;
  successActions?: Record<string, SuccessAction>;
  failureActions?: Record<string, FailureAction>;
}

/** @public */
export type JSONSchema = Record<string, any>;
