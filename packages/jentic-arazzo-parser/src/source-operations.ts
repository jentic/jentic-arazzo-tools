import type { ParseResultElement } from '@speclynx/apidom-datamodel';
import {
  isArazzoSpecification1Element,
  isSourceDescriptionElement,
} from '@speclynx/apidom-ns-arazzo-1';
import {
  isSwaggerElement,
  isPathItemElement as isPathItem2Element,
  type PathItemElement as PathItem2Element,
} from '@speclynx/apidom-ns-openapi-2';
import {
  isOpenApi3_0Element,
  isPathItemElement as isPathItem3Element,
  type PathItemElement as PathItem3Element,
} from '@speclynx/apidom-ns-openapi-3-0';
import { isOpenApi3_1Element } from '@speclynx/apidom-ns-openapi-3-1';

/**
 * HTTP method and path of the OpenAPI operation targeted by a step.
 * @public
 */
export interface StepOperation {
  /** upper-case HTTP method, e.g. `GET` */
  method: string;
  path?: string;
}

/**
 * Operations of OpenAPI source descriptions, keyed by source description name and then by operationId.
 * @public
 */
export type SourceOperations = Map<string, Map<string, StepOperation>>;

/**
 * Minimal shape of a plain Arazzo Document needed to attach step operations.
 * @public
 */
export interface StepOperationsDocument {
  workflows?: { steps?: { operationId?: string; operationPath?: string }[] }[];
}

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

// OpenAPI 3.1 path items extend the OpenAPI 3.0 ones, so both are covered by isPathItem3Element
const pathItemOperations = (pathItem: PathItem2Element | PathItem3Element) => ({
  GET: pathItem.getField,
  PUT: pathItem.put,
  POST: pathItem.post,
  DELETE: pathItem.deleteField,
  OPTIONS: pathItem.options,
  HEAD: pathItem.head,
  PATCH: pathItem.patch,
  TRACE: isPathItem3Element(pathItem) ? pathItem.trace : undefined,
});

const decodePointerSegment = (segment: string) => segment.replace(/~1/g, '/').replace(/~0/g, '~');

/**
 * Indexes the operations of the `openapi` source descriptions of a parsed Arazzo Document by
 * source description name and operationId. Requires the `sourceDescriptions` parser option;
 * source descriptions that failed to load index nothing.
 * @param parseResult - The result of parseArazzo
 * @returns The indexed operations
 * @public
 */
export function indexSourceOperations(parseResult: ParseResultElement): SourceOperations {
  const index: SourceOperations = new Map();
  if (!isArazzoSpecification1Element(parseResult.api)) return index;

  parseResult.api.sourceDescriptions?.forEach((sourceDescription) => {
    if (!isSourceDescriptionElement(sourceDescription)) return;
    const name = sourceDescription.name?.toValue();
    if (typeof name !== 'string' || sourceDescription.type?.toValue() !== 'openapi') return;
    const { api } = (sourceDescription.meta.get('parseResult') ?? {}) as ParseResultElement;
    if (!isSwaggerElement(api) && !isOpenApi3_0Element(api) && !isOpenApi3_1Element(api)) return;

    const operations = new Map<string, StepOperation>();
    api.paths?.forEach((pathItem, pathKey) => {
      if (!isPathItem2Element(pathItem) && !isPathItem3Element(pathItem)) return;
      const path = String(pathKey.toValue());
      for (const [method, operation] of Object.entries(pathItemOperations(pathItem))) {
        const operationId = operation?.operationId?.toValue();
        if (typeof operationId === 'string' && !operations.has(operationId)) {
          operations.set(operationId, { method, path });
        }
      }
    });
    index.set(name, operations);
  });

  return index;
}

/**
 * Resolves the HTTP method and path of a step that targets an OpenAPI operation.
 * @param step - A plain Arazzo Step Object
 * @param sources - Operations indexed by indexSourceOperations
 * @returns The operation, or undefined for workflow steps and operations that can't be located
 * @public
 */
export function resolveStepOperation(
  step: { operationId?: string; operationPath?: string },
  sources: SourceOperations,
): StepOperation | undefined {
  if (step.operationPath) {
    // `{$sourceDescriptions.name.url}#/paths/~1pets/get`: the pointer names the operation
    const pointer = step.operationPath.split('#')[1];
    const [, root, path, method] = pointer?.split('/').map(decodePointerSegment) ?? [];
    if (root === 'paths' && path && HTTP_METHODS.includes(method)) {
      return { method: method.toUpperCase(), path };
    }
    return undefined;
  }

  if (step.operationId) {
    // either `$sourceDescriptions.name.operationId` or a bare operationId
    const qualified = /^\$sourceDescriptions\.([^.]+)\.(.+)$/.exec(step.operationId);
    if (qualified) return sources.get(qualified[1])?.get(qualified[2]);
    for (const operations of sources.values()) {
      const operation = operations.get(step.operationId);
      if (operation) return operation;
    }
  }

  return undefined;
}

/**
 * Attaches the resolved operation as `_operation` to every step of a plain Arazzo Document
 * that targets an OpenAPI operation.
 * @param doc - A plain Arazzo Document
 * @param sources - Operations indexed by indexSourceOperations
 * @returns A copy of the document with `_operation` set on the resolved steps
 * @public
 */
export function attachStepOperations<T extends StepOperationsDocument>(
  doc: T,
  sources: SourceOperations,
): T {
  if (sources.size === 0) return doc;
  return {
    ...doc,
    workflows: (doc.workflows || []).map((workflow) => ({
      ...workflow,
      steps: (workflow.steps || []).map((step) => {
        const operation = resolveStepOperation(step, sources);
        return operation ? { ...step, _operation: operation } : step;
      }),
    })),
  };
}
