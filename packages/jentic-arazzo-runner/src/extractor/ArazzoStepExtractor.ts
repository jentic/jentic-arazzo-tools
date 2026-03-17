import { isArrayElement } from '@speclynx/apidom-datamodel';
import {
  type WorkflowElement,
  type StepElement,
  isStepElement,
} from '@speclynx/apidom-ns-arazzo-1';
import { toValue } from '@speclynx/apidom-core';

import ExtractionError from '../errors/ExtractionError.ts';

/**
 * Extracts a step from an Arazzo workflow by stepId.
 *
 * Searches the workflow's steps array for the matching stepId.
 * The workflow should be already extracted via ArazzoWorkflowExtractor.
 * @public
 */
class ArazzoStepExtractor {
  /**
   * Extracts a step element by stepId from a workflow.
   */
  extract(workflow: WorkflowElement, stepId: string): StepElement {
    const steps = workflow.steps;

    if (!isArrayElement(steps)) {
      throw new ExtractionError(`Workflow "${toValue(workflow.workflowId)}" has no steps`, {
        workflowId: toValue(workflow.workflowId),
      });
    }

    for (const step of steps) {
      if (!isStepElement(step)) continue;
      if (toValue(step.stepId) === stepId) {
        step.meta.set('workflowId', workflow.workflowId);
        return step;
      }
    }

    throw new ExtractionError(
      `Step "${stepId}" not found in workflow "${toValue(workflow.workflowId)}"`,
      { workflowId: toValue(workflow.workflowId), stepId },
    );
  }
}

export default ArazzoStepExtractor;
