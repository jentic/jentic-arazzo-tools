import { toValue } from '@speclynx/apidom-core';
import type { Element, ParseResultElement } from '@speclynx/apidom-datamodel';
import { compile, evaluate, URIFragmentIdentifier } from '@speclynx/apidom-json-pointer';
import {
  isArazzoSpecification1Element,
  isSourceDescriptionElement,
  type SourceDescriptionElement,
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

/**
 * A plain Arazzo Document whose steps may carry the `_operation` they target. Every other field
 * of the document type, and of its workflows and steps, is preserved as is.
 * @public
 */
export type StepOperationsResult<T extends StepOperationsDocument = StepOperationsDocument> = {
  [K in keyof T]: K extends 'workflows'
    ? NonNullable<T[K]> extends readonly (infer Workflow)[]
      ? {
          [W in keyof Workflow]: W extends 'steps'
            ? NonNullable<Workflow[W]> extends readonly (infer Step)[]
              ? (Step & { _operation?: StepOperation })[]
              : Workflow[W]
            : Workflow[W];
        }[]
      : T[K]
    : T[K];
};

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

// resolves a (possibly relative) URI against the document it appears in, as far as possible
const resolveURI = (uri: string, baseURI?: string) => {
  try {
    return new URL(uri, baseURI).href;
  } catch {
    return uri;
  }
};

// whether a literal URL targets the document of the source description, as declared or as retrieved
const targetsSource = (
  sourceDescription: SourceDescriptionElement,
  documentURI: string,
  baseURI?: string,
): boolean => {
  const target = resolveURI(documentURI, baseURI);
  const url = sourceDescription.url?.toValue() as string | undefined;
  const retrievalURI = (
    sourceDescription.meta.get('parseResult') as ParseResultElement | undefined
  )?.meta.get('retrievalURI') as string | undefined;

  return [url, retrievalURI].some(
    (uri) => uri !== undefined && (uri === documentURI || resolveURI(uri, baseURI) === target),
  );
};

const pointerTokens = (pointer: string) =>
  pointer
    .split('/')
    .slice(1)
    .map((token) => token.replace(/~1/g, '/').replace(/~0/g, '~'));

// resolves a JSON Pointer against a source document, so it can target operations of both
// `paths` entries and reusable Path Items (`#/components/pathItems/...`)
const operationAtPointer = (api: Element, pointer: string): StepOperation | undefined => {
  const tokens = pointerTokens(pointer);
  const withPath = (method: string): StepOperation => ({
    method: method.toUpperCase(),
    ...(tokens[0] === 'paths' && { path: tokens[1] }),
  });
  const evaluateAt = (parts: string[]) => {
    try {
      return evaluate<unknown>(api, compile(parts));
    } catch {
      return undefined;
    }
  };

  const target = evaluateAt(tokens);
  // a pointer to a path item (no method) is unambiguous only when it has a single operation
  if (isPathItem2Element(target) || isPathItem3Element(target)) {
    const defined = Object.entries(pathItemOperations(target)).filter(([, operation]) => operation);
    return defined.length === 1 ? withPath(defined[0][0]) : undefined;
  }

  const method = tokens[tokens.length - 1];
  const parent = evaluateAt(tokens.slice(0, -1));
  if (!target || !(isPathItem2Element(parent) || isPathItem3Element(parent))) return undefined;
  return Object.keys(pathItemOperations(parent)).includes(method) ? withPath(method) : undefined;
};

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
  // a literal URL (no `$sourceDescriptions` expression) names its source by the document it targets
  const documentURI =
    operationPath && !sourceName ? operationPath.split('#')[0].replace(/^\{|\}$/g, '') : '';
  const baseURI = parseResult.meta.get('retrievalURI') as string | undefined;
  let found: StepOperation | undefined;

  parseResult.api.sourceDescriptions?.forEach((sourceDescription) => {
    if (found || !isSourceDescriptionElement(sourceDescription)) return;
    if (sourceDescription.type && sourceDescription.type.toValue() !== 'openapi') return;
    if (sourceName && sourceDescription.name?.toValue() !== sourceName) return;
    // the source must be the one the URL targets, and it is not searched when it failed to load
    if (documentURI && !targetsSource(sourceDescription, documentURI, baseURI)) return;
    const api = (sourceDescription.meta.get('parseResult') as ParseResultElement | undefined)?.api;
    if (!isSwaggerElement(api) && !isOpenApi3_0Element(api) && !isOpenApi3_1Element(api)) return;

    if (pointer) {
      found = operationAtPointer(api, pointer);
      return;
    }

    api.paths?.forEach((pathItem, key) => {
      if (found || (!isPathItem2Element(pathItem) && !isPathItem3Element(pathItem))) return;
      const path = String(key.toValue());
      for (const [method, operation] of Object.entries(pathItemOperations(pathItem))) {
        if (operation?.operationId?.toValue() === (qualifiedId ?? operationId)) {
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
 * @returns The plain Arazzo Document, typed with `_operation` on its steps and set on the resolved ones
 * @public
 */
export function attachStepOperations<T extends StepOperationsDocument = StepOperationsDocument>(
  element: Element | undefined,
  parseResult: ParseResultElement,
): StepOperationsResult<T> {
  const doc = toValue(element) as StepOperationsDocument;
  doc?.workflows?.forEach((workflow) =>
    workflow.steps?.forEach((step) => {
      const operation = findStepOperation(parseResult, step);
      if (operation) Object.assign(step, { _operation: operation });
    }),
  );
  return doc as StepOperationsResult<T>;
}
