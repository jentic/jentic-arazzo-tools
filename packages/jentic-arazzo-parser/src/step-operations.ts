import { toValue } from '@speclynx/apidom-core';
import type { Element, ParseResultElement } from '@speclynx/apidom-datamodel';
import { compile, URIFragmentIdentifier } from '@speclynx/apidom-json-pointer';
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
 * HTTP method and path of the OpenAPI operation targeted by an Arazzo step.
 * @public
 */
export interface StepOperation {
  /** upper-case HTTP method, e.g. `GET` */
  method: string;
  path?: string;
}

/**
 * Minimal shape of a plain Arazzo Document needed to attach step operations.
 * @public
 */
export interface StepOperationsDocument {
  workflows?: { steps?: { operationId?: string; operationPath?: string }[] }[];
}

// OpenAPI 3.1 path items extend the OpenAPI 3.0 ones, so isPathItem3Element covers both
const pathItemOperations = (pathItem: PathItem2Element | PathItem3Element) => ({
  get: pathItem.getField,
  put: pathItem.put,
  post: pathItem.post,
  delete: pathItem.deleteField,
  options: pathItem.options,
  head: pathItem.head,
  patch: pathItem.patch,
  trace: isPathItem3Element(pathItem) ? pathItem.trace : undefined,
});

/**
 * Finds the OpenAPI operation targeted by an Arazzo step in the `openapi` source descriptions
 * parsed along with the Arazzo Document (see the `sourceDescriptions` parser option).
 * @param parseResult - The result of parsing an Arazzo Document with source descriptions
 * @param step - The step's `operationId` or `operationPath`
 * @returns The operation's HTTP method and path, or undefined when it can't be located
 * @public
 */
export function findStepOperation(
  parseResult: ParseResultElement,
  { operationId, operationPath }: { operationId?: string; operationPath?: string },
): StepOperation | undefined {
  const reference = operationPath ?? operationId;
  if (!reference || !isArazzoSpecification1Element(parseResult.api)) return undefined;
  // `$sourceDescriptions.{name}.{operationId}` and `{$sourceDescriptions.{name}.url}#{pointer}` name their source
  const [, sourceName, qualifiedId] =
    /^\{?\$sourceDescriptions\.([^.]+)\.(.+)$/.exec(reference) ?? [];
  const pointer = operationPath && URIFragmentIdentifier.fromURIReference(operationPath);
  let found: StepOperation | undefined;

  parseResult.api.sourceDescriptions?.forEach((sourceDescription) => {
    if (found || !isSourceDescriptionElement(sourceDescription)) return;
    if (sourceDescription.type?.toValue() !== 'openapi') return;
    if (sourceName && sourceDescription.name?.toValue() !== sourceName) return;
    const api = (sourceDescription.meta.get('parseResult') as ParseResultElement | undefined)?.api;
    if (!isSwaggerElement(api) && !isOpenApi3_0Element(api) && !isOpenApi3_1Element(api)) return;

    api.paths?.forEach((pathItem, key) => {
      if (found || (!isPathItem2Element(pathItem) && !isPathItem3Element(pathItem))) return;
      const path = String(key.toValue());
      for (const [method, operation] of Object.entries(pathItemOperations(pathItem))) {
        const matches = pointer
          ? pointer === compile(['paths', path, method])
          : operation?.operationId?.toValue() === (qualifiedId ?? operationId);
        if (operation && matches) {
          found = { method: method.toUpperCase(), path };
          return;
        }
      }
    });
  });

  return found;
}

/**
 * Converts an Arazzo Document element to a plain object and sets `_operation` on every step that
 * targets an operation of the `openapi` source descriptions parsed along with it.
 * @param element - The Arazzo Document element, e.g. the (dereferenced) result of the parse result
 * @param parseResult - The result of parsing the Arazzo Document with source descriptions
 * @returns The plain Arazzo Document with `_operation` set on the resolved steps
 * @public
 */
export function attachStepOperations<T extends StepOperationsDocument = StepOperationsDocument>(
  element: Element | undefined,
  parseResult: ParseResultElement,
): T {
  const doc = toValue(element) as T;
  doc?.workflows?.forEach((workflow) =>
    workflow.steps?.forEach((step) => {
      const operation = findStepOperation(parseResult, step);
      if (operation) Object.assign(step, { _operation: operation });
    }),
  );
  return doc;
}
