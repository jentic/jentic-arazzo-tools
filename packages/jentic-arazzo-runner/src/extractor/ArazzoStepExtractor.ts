import { isArrayElement } from '@speclynx/apidom-datamodel';
import { type WorkflowElement } from '@speclynx/apidom-ns-arazzo-1';
import { toValue } from '@speclynx/apidom-core';
import { type Path, traverse } from '@speclynx/apidom-traverse';

import ExtractionError from '../errors/ExtractionError.ts';
import { ArazzoStepElement } from '../document/arazzo-types.ts';

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
  extract(workflow: WorkflowElement, stepId: string): ArazzoStepElement {
    const steps = workflow.steps;
    let step: ArazzoStepElement | undefined;

    if (!isArrayElement(steps)) {
      throw new ExtractionError(`Workflow "${toValue(workflow.workflowId)}" has no steps`, {
        workflowId: toValue(workflow.workflowId),
      });
    }

    traverse(workflow, {
      StepElement(path: Path<ArazzoStepElement>) {
        if (!path.node.stepId?.equals(stepId)) return path.skip();

        step = path.node;
        step.meta.set('workflowId', toValue(workflow.workflowId));
        path.stop();
      },
    });

    if (!step) {
      throw new ExtractionError(
        `Step "${stepId}" not found in workflow "${toValue(workflow.workflowId)}"`,
        { workflowId: toValue(workflow.workflowId), stepId },
      );
    }

    return step;
  }
}

export default ArazzoStepExtractor;
