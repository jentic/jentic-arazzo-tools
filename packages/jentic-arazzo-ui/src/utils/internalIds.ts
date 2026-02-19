/**
 * Internal ID utilities for stable selection tracking during ID editing.
 *
 * The problem: When a user edits a stepId/workflowId field, if we use that ID
 * for selection tracking, the selection is lost as soon as they clear the field
 * to type a new value.
 *
 * The solution: Assign stable internal UUIDs to entities that never change
 * during the entity's lifetime. Use these for all internal selection/tracking.
 * Strip them when exporting documents.
 */

import { ArazzoDocument, Workflow, Step, SourceDescription } from '../types/arazzo';

/**
 * Generate a UUID for internal tracking.
 * Uses crypto.randomUUID() for modern browsers.
 */
export function generateInternalId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Assign internal IDs to all entities in a document that don't have them.
 * This should be called when loading a document.
 */
export function assignInternalIds(doc: ArazzoDocument): ArazzoDocument {
  return {
    ...doc,
    sourceDescriptions: (doc.sourceDescriptions || []).map((source) => ({
      ...source,
      _internalId: source._internalId || generateInternalId(),
    })),
    workflows: (doc.workflows || []).map((workflow) => ({
      ...workflow,
      _internalId: workflow._internalId || generateInternalId(),
      steps: (workflow.steps || []).map((step) => ({
        ...step,
        _internalId: step._internalId || generateInternalId(),
      })),
    })),
  };
}

/**
 * Merge internal IDs from an existing document into a new document.
 *
 * This is used when parsing text edits - the new document has no internal IDs,
 * but we want to preserve them from the existing document to maintain referential
 * integrity. We match by position (array index) since stepIds/workflowIds may
 * have changed during the edit.
 *
 * For workflows: Match by index, fall back to workflowId if indexes don't align
 * For steps: Match by index within their workflow, fall back to stepId
 * For sources: Match by index, fall back to name
 *
 * New entities (added at end or middle) get fresh IDs.
 */
export function mergeInternalIds(
  newDoc: ArazzoDocument,
  existingDoc: ArazzoDocument,
): ArazzoDocument {
  // Build lookup maps for fallback matching by business ID
  const existingWorkflowsByBusinessId = new Map<string, Workflow>();
  const existingStepsByWorkflowAndBusinessId = new Map<string, Map<string, Step>>();

  // Handle potentially undefined workflows array
  if (existingDoc.workflows) {
    for (const workflow of existingDoc.workflows) {
      existingWorkflowsByBusinessId.set(workflow.workflowId, workflow);
      const stepMap = new Map<string, Step>();
      for (const step of workflow.steps) {
        stepMap.set(step.stepId, step);
      }
      // Use internal ID if available, otherwise workflowId as key
      existingStepsByWorkflowAndBusinessId.set(
        workflow._internalId || workflow.workflowId,
        stepMap,
      );
    }
  }

  const existingSourcesByName = new Map<string, SourceDescription>();
  if (existingDoc.sourceDescriptions) {
    for (const source of existingDoc.sourceDescriptions) {
      existingSourcesByName.set(source.name, source);
    }
  }

  return {
    ...newDoc,
    sourceDescriptions: (newDoc.sourceDescriptions || []).map((source, index) => {
      // Try by index first
      const existingByIndex = existingDoc.sourceDescriptions?.[index];
      if (existingByIndex?._internalId) {
        return { ...source, _internalId: existingByIndex._internalId };
      }
      // Fallback: match by name
      const existingByName = existingSourcesByName.get(source.name);
      if (existingByName?._internalId) {
        return { ...source, _internalId: existingByName._internalId };
      }
      // New source
      return { ...source, _internalId: generateInternalId() };
    }),
    workflows: (newDoc.workflows || []).map((workflow, workflowIndex) => {
      // Try by index first
      let existingWorkflow: Workflow | undefined = existingDoc.workflows?.[workflowIndex];
      let workflowInternalId = existingWorkflow?._internalId;

      // Fallback: match by workflowId (in case workflows were reordered)
      if (!workflowInternalId) {
        existingWorkflow = existingWorkflowsByBusinessId.get(workflow.workflowId);
        workflowInternalId = existingWorkflow?._internalId;
      }

      // Get the step map for this workflow (by internal ID or workflowId)
      const existingStepMap =
        existingStepsByWorkflowAndBusinessId.get(existingWorkflow?._internalId || '') ||
        existingStepsByWorkflowAndBusinessId.get(existingWorkflow?.workflowId || '');

      return {
        ...workflow,
        _internalId: workflowInternalId || generateInternalId(),
        steps: workflow.steps.map((step, stepIndex) => {
          // Try by index first (within the same workflow)
          const existingByIndex = existingWorkflow?.steps[stepIndex];
          if (existingByIndex?._internalId) {
            return { ...step, _internalId: existingByIndex._internalId };
          }
          // Fallback: match by stepId (in case steps were reordered)
          const existingByStepId = existingStepMap?.get(step.stepId);
          if (existingByStepId?._internalId) {
            return { ...step, _internalId: existingByStepId._internalId };
          }
          // New step
          return { ...step, _internalId: generateInternalId() };
        }),
      };
    }),
  };
}

/**
 * Strip internal IDs from a document for export.
 * Returns a clean document that conforms to the Arazzo spec.
 */
export function stripInternalIds(doc: ArazzoDocument): ArazzoDocument {
  return {
    ...doc,
    sourceDescriptions: (doc.sourceDescriptions || []).map((source) => {
      const { _internalId, ...rest } = source;
      return rest as SourceDescription;
    }),
    workflows: (doc.workflows || []).map((workflow) => {
      const { _internalId: _workflowInternalId, ...workflowRest } = workflow;
      return {
        ...workflowRest,
        steps: (workflow.steps || []).map((step) => {
          const { _internalId: _stepInternalId, ...stepRest } = step;
          return stepRest as Step;
        }),
      } as Workflow;
    }),
  };
}

/**
 * Find a step by its internal ID across all workflows.
 */
export function findStepByInternalId(
  doc: ArazzoDocument,
  internalId: string,
): { workflow: Workflow; step: Step } | null {
  if (!doc.workflows) return null;
  for (const workflow of doc.workflows) {
    const step = (workflow.steps || []).find((s) => s._internalId === internalId);
    if (step) {
      return { workflow, step };
    }
  }
  return null;
}

/**
 * Find a workflow by its internal ID.
 */
export function findWorkflowByInternalId(doc: ArazzoDocument, internalId: string): Workflow | null {
  if (!doc.workflows) return null;
  return doc.workflows.find((w) => w._internalId === internalId) || null;
}

/**
 * Find a source description by its internal ID.
 */
export function findSourceByInternalId(
  doc: ArazzoDocument,
  internalId: string,
): SourceDescription | null {
  if (!doc.sourceDescriptions) return null;
  return doc.sourceDescriptions.find((s) => s._internalId === internalId) || null;
}
