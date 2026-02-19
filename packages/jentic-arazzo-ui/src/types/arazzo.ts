/**
 * Arazzo Specification v1.0.1 Type Definitions
 * Based on: https://spec.openapis.org/arazzo/latest.html
 */

export interface ArazzoDocument {
  arazzo: string;
  info: InfoObject;
  sourceDescriptions: SourceDescription[];
  workflows: Workflow[];
  components?: ComponentsObject;
}

export interface InfoObject {
  title: string;
  version: string;
  summary?: string;
  description?: string;
}

export interface SourceDescription {
  name: string;
  url: string;
  type?: 'openapi' | 'arazzo';
  /** Internal tracking ID - not part of Arazzo spec, stripped on export */
  _internalId?: string;
}

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

export interface Parameter {
  name: string;
  in?: 'path' | 'query' | 'header' | 'cookie';
  value: any;
}

export interface RequestBody {
  contentType?: string;
  payload?: any;
  replacements?: PayloadReplacement[];
}

export interface PayloadReplacement {
  target: string;
  value: any;
}

export interface SuccessAction {
  name: string;
  type: 'end' | 'goto';
  workflowId?: string;
  stepId?: string;
  criteria?: Criterion[];
}

export interface FailureAction {
  name: string;
  type: 'end' | 'retry' | 'goto';
  workflowId?: string;
  stepId?: string;
  retryAfter?: number;
  retryLimit?: number;
  criteria?: Criterion[];
}

export interface Criterion {
  context?: string;
  condition: string;
  type?: 'simple' | 'regex' | 'jsonpath' | 'xpath' | CriterionExpressionType;
}

export interface CriterionExpressionType {
  type: 'jsonpath' | 'xpath';
  version: string;
}

export interface ReusableObject {
  reference: string;
  value?: string;
}

export interface ComponentsObject {
  inputs?: Record<string, JSONSchema>;
  parameters?: Record<string, Parameter>;
  successActions?: Record<string, SuccessAction>;
  failureActions?: Record<string, FailureAction>;
}

export type JSONSchema = Record<string, any>;
