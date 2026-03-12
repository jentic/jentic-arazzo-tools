import type { WorkflowElement } from '@speclynx/apidom-ns-arazzo-1';
import { evaluate } from '@speclynx/apidom-json-pointer';

import type ArazzoDocument from '../document/ArazzoDocument.ts';
import type { WorkflowId } from '../document/ArazzoWorkflowIndex.ts';
import ArazzoWorkflowNotFoundError from '../errors/ArazzoWorkflowNotFoundError.ts';

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
    if (pointer === undefined) {
      throw new ArazzoWorkflowNotFoundError(
        `Workflow "${workflowId}" not found in Arazzo document at "${document.uri}"`,
        { workflowId, uri: document.uri },
      );
    }

    return evaluate<WorkflowElement>(document.parseResult.api, pointer);
  }
}

export default ArazzoWorkflowExtractor;
