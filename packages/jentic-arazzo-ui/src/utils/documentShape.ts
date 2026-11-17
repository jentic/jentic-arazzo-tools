import type { ArazzoDocument } from '../types/arazzo';
import type { DiagnosticPath } from './validation';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Keeps the objects of a list and records where each kept item came from: the result maps a
 * source index to its index in the kept list (undefined for dropped items).
 */
function keepObjects<T>(value: unknown): { items: T[]; newIndex: (number | undefined)[] } {
  const items: T[] = [];
  const newIndex: (number | undefined)[] = [];
  if (Array.isArray(value)) {
    value.forEach((item) => {
      newIndex.push(isObject(item) ? items.push(item as T) - 1 : undefined);
    });
  }
  return { items, newIndex };
}

export interface NormalizedDocument {
  document: ArazzoDocument;
  /**
   * Maps a path in the source document (e.g. a validation diagnostic's) onto the normalized
   * document. A path into a dropped step maps to its workflow, and a path into a dropped workflow
   * to undefined, as there is nothing left to show it on.
   */
  remapPath: (path: DiagnosticPath) => DiagnosticPath | undefined;
}

const identity = (path: DiagnosticPath) => path;

/**
 * Gives an invalid document the container shape the viewer iterates over: `info` an object,
 * and `sourceDescriptions`, `workflows` and each workflow's `steps` lists of objects. Anything
 * else is dropped here and reported by validation, so the rest of the document still displays.
 * Valid documents come back unchanged.
 */
export function normalizeDocumentShape(document: ArazzoDocument): NormalizedDocument {
  const doc = document as unknown as Record<string, unknown>;
  const workflows = keepObjects<Record<string, unknown>>(doc.workflows);
  const steps = workflows.items.map((workflow) => keepObjects(workflow.steps));
  const isValid =
    isObject(doc.info) &&
    Array.isArray(doc.sourceDescriptions) &&
    doc.sourceDescriptions.every(isObject) &&
    Array.isArray(doc.workflows) &&
    workflows.items.length === doc.workflows.length &&
    workflows.items.every(
      (workflow, i) =>
        Array.isArray(workflow.steps) && steps[i].items.length === workflow.steps.length,
    );
  if (isValid) return { document, remapPath: identity };

  const sourceDescriptions = keepObjects(doc.sourceDescriptions);

  const remapPath = (path: DiagnosticPath): DiagnosticPath | undefined => {
    const [section, index, ...rest] = path;
    if (typeof index !== 'number') return path;
    if (section === 'sourceDescriptions') {
      const kept = sourceDescriptions.newIndex[index];
      return kept === undefined ? undefined : [section, kept, ...rest];
    }
    if (section !== 'workflows') return path;

    const workflowIndex = workflows.newIndex[index];
    if (workflowIndex === undefined) return undefined;
    const [field, stepIndex, ...stepRest] = rest;
    if (field !== 'steps' || typeof stepIndex !== 'number') {
      return [section, workflowIndex, ...rest];
    }
    const kept = steps[workflowIndex].newIndex[stepIndex];
    return kept === undefined
      ? [section, workflowIndex]
      : [section, workflowIndex, field, kept, ...stepRest];
  };

  return {
    document: {
      ...doc,
      info: isObject(doc.info) ? doc.info : {},
      sourceDescriptions: sourceDescriptions.items,
      workflows: workflows.items.map((workflow, i) => ({ ...workflow, steps: steps[i].items })),
    } as unknown as ArazzoDocument,
    remapPath,
  };
}
