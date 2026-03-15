import type { WorkflowElement } from '@speclynx/apidom-ns-arazzo-1';
import { evaluate } from '@speclynx/apidom-json-pointer';

import type ArazzoDocument from '../document/ArazzoDocument.ts';
import type { WorkflowId } from '../document/ArazzoWorkflowIndex.ts';
import ExtractionError from '../errors/ExtractionError.ts';

/**
 * Extracts a workflow from an Arazzo document by workflowId.
 *
 * The workflow is already fully dereferenced in the document,
 * so no additional processing is needed.
 * @public
 */
class ArazzoWorkflowExtractor {
  /**
   * Extracts a workflow element by workflowId.
   */
  extract(document: ArazzoDocument, workflowId: WorkflowId): WorkflowElement {
    const pointer = document.workflowIndex.get(workflowId);
    let workflow: WorkflowElement;

    if (pointer === undefined) {
      throw new ExtractionError(
        `Workflow "${workflowId}" not found in Arazzo document at "${document.uri}"`,
        { workflowId, uri: document.uri },
      );
    }

    try {
      workflow = evaluate<WorkflowElement>(document.parseResult.api, pointer);
    } catch (error: unknown) {
      throw new ExtractionError(
        `Failed to evaluate pointer "${pointer}" in Arazzo document at "${document.uri}"`,
        { cause: error, workflowId, pointer, uri: document.uri },
      );
    }

    if (workflow?.element !== 'workflow') {
      throw new ExtractionError(
        `Pointer "${pointer}" does not reference a workflow in Arazzo document at "${document.uri}"`,
        { workflowId, pointer, uri: document.uri },
      );
    }

    return workflow;
  }
}

export default ArazzoWorkflowExtractor;
