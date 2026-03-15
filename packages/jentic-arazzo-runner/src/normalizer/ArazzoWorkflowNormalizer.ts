import type { WorkflowElement } from '@speclynx/apidom-ns-arazzo-1';
import { toValue } from '@speclynx/apidom-core';
import { dereferenceArazzoElement, defaultDereferenceArazzoOptions } from '@jentic/arazzo-resolver';
import {
  mergeOptions,
  type ApiDOMReferenceOptions,
} from '@speclynx/apidom-reference/configuration/empty';
import type { PartialDeep } from 'type-fest';

import type ArazzoDocument from '../document/ArazzoDocument.ts';
import NormalizationError from '../errors/NormalizationError.ts';
import { providerOptionsOverride as arazzoProviderOptions } from '../registry/providers/ArazzoDocumentRegistryProvider.ts';

/**
 * Options for normalizing an Arazzo workflow.
 * @public
 */
export type ArazzoWorkflowNormalizerOptions = PartialDeep<ApiDOMReferenceOptions>;

/**
 * Default options for normalizing an Arazzo workflow.
 */
const normalizerOptionsOverride = mergeOptions(arazzoProviderOptions as ApiDOMReferenceOptions, {
  dereference: {
    immutable: false,
    strategyOpts: {
      sourceDescriptions: false,
    },
  },
});

/**
 * Normalizes an extracted Arazzo workflow.
 *
 * Dereferences the workflow subtree ($components.* references),
 * producing a self-contained workflow element.
 *
 * By default, dereferencing mutates the workflow element in-place
 * (immutable: false). This allows the document registry to act as
 * a natural cache — subsequent accesses return the already-dereferenced
 * workflow without additional processing.
 * @public
 */
class ArazzoWorkflowNormalizer {
  readonly #options: ApiDOMReferenceOptions;

  constructor(options: ArazzoWorkflowNormalizerOptions = {}) {
    this.#options = mergeOptions(normalizerOptionsOverride as ApiDOMReferenceOptions, options);
  }

  /**
   * Dereferences the workflow subtree against its parent document.
   */
  async normalize(workflow: WorkflowElement, document: ArazzoDocument): Promise<WorkflowElement> {
    try {
      return await dereferenceArazzoElement(
        workflow,
        mergeOptions(
          defaultDereferenceArazzoOptions as ApiDOMReferenceOptions,
          mergeOptions(this.#options, {
            dereference: {
              strategyOpts: { parseResult: document.parseResult },
            },
          }),
        ),
      );
    } catch (error: unknown) {
      throw new NormalizationError(
        `Failed to normalize workflow "${toValue(workflow.workflowId)}" in Arazzo document at "${document.uri}"`,
        { cause: error, workflowId: toValue(workflow.workflowId), uri: document.uri },
      );
    }
  }
}

export default ArazzoWorkflowNormalizer;
