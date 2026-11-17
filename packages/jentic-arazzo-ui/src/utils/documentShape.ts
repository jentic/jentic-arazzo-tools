import type { ArazzoDocument } from '../types/arazzo';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const objectsIn = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value.filter(isObject) as T[]) : [];

/**
 * Gives an invalid document the container shape the viewer iterates over: `info` an object,
 * and `sourceDescriptions`, `workflows` and each workflow's `steps` lists of objects. Anything
 * else is dropped here and reported by validation, so the rest of the document still displays.
 * Valid documents come back unchanged.
 */
export function normalizeDocumentShape(document: ArazzoDocument): ArazzoDocument {
  const doc = document as unknown as Record<string, unknown>;
  const workflows = objectsIn<Record<string, unknown>>(doc.workflows);
  const isValid =
    isObject(doc.info) &&
    Array.isArray(doc.sourceDescriptions) &&
    doc.sourceDescriptions.every(isObject) &&
    Array.isArray(doc.workflows) &&
    workflows.length === doc.workflows.length &&
    workflows.every((w) => Array.isArray(w.steps) && w.steps.every(isObject));
  if (isValid) return document;

  return {
    ...doc,
    info: isObject(doc.info) ? doc.info : {},
    sourceDescriptions: objectsIn(doc.sourceDescriptions),
    workflows: workflows.map((workflow) => ({ ...workflow, steps: objectsIn(workflow.steps) })),
  } as unknown as ArazzoDocument;
}
