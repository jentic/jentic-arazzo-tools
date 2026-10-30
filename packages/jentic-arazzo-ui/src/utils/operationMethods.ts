import { toValue } from '@speclynx/apidom-core';

import type { ArazzoDocument, StepOperation } from '../types/arazzo';

/** badge colors per upper-case HTTP method */
export const HTTP_METHOD_COLORS: Record<string, { background: string; color: string }> = {
  GET: { background: '#dbeafe', color: '#1e40af' },
  POST: { background: '#dcfce7', color: '#166534' },
  PUT: { background: '#fef3c7', color: '#92400e' },
  PATCH: { background: '#ede9fe', color: '#5b21b6' },
  DELETE: { background: '#fee2e2', color: '#991b1b' },
};

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

/** an operation of a source description, keyed by its operationId */
type IndexedOperations = Map<string, StepOperation>;

/** operations of OpenAPI source descriptions, keyed by source description name */
export type SourceOperations = Map<string, IndexedOperations>;

// minimal structural view of an ApiDOM element, so no namespace packages are needed
interface ElementLike {
  get?: (key: string) => ElementLike | undefined;
  forEach?: (callback: (value: ElementLike, key: ElementLike) => void) => void;
}

function decodePointerSegment(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

/**
 * Indexes the operations of the OpenAPI source descriptions attached to a parsed Arazzo
 * document (see the `sourceDescriptions` parser option) by name and operationId.
 * Source descriptions that failed to load, or are not OpenAPI documents, are skipped.
 */
export function indexSourceOperations(parseResult: unknown): SourceOperations {
  const index: SourceOperations = new Map();
  const sourceDescriptions = (parseResult as { api?: ElementLike }).api?.get?.(
    'sourceDescriptions',
  );

  sourceDescriptions?.forEach?.((sourceDescription) => {
    const name = toValue(sourceDescription.get?.('name'));
    const sourceApi = (sourceDescription as { meta?: { get(key: string): unknown } }).meta?.get(
      'parseResult',
    ) as { api?: ElementLike } | undefined;
    const paths = sourceApi?.api?.get?.('paths');
    if (typeof name !== 'string' || !paths?.forEach) return;

    const operations: IndexedOperations = new Map();
    paths.forEach((pathItem, pathKey) => {
      const path = toValue(pathKey) as string;
      for (const method of HTTP_METHODS) {
        const operationId = toValue(pathItem.get?.(method)?.get?.('operationId'));
        if (typeof operationId === 'string' && !operations.has(operationId)) {
          operations.set(operationId, { method: method.toUpperCase(), path });
        }
      }
    });
    index.set(name, operations);
  });

  return index;
}

/**
 * Resolves the HTTP method and path of a step that targets an OpenAPI operation.
 * Returns undefined for workflow steps and for operations that can't be located.
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

/** Attaches the resolved `_operation` to every step of a document that targets an operation. */
export function attachStepOperations(
  doc: ArazzoDocument,
  sources: SourceOperations,
): ArazzoDocument {
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
