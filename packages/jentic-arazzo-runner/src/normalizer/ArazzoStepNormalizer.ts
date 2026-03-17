import type { ArazzoStepElement } from '../document/arazzo-types.ts';
import type ArazzoDocument from '../document/ArazzoDocument.ts';

/**
 * Normalizes an extracted Arazzo step.
 *
 * Currently acts as an identity function. Steps are already
 * dereferenced as part of workflow normalization and have no
 * inherited properties to merge.
 * @public
 */
class ArazzoStepNormalizer {
  /**
   * Normalizes a step element against its parent document.
   */
  async normalize(step: ArazzoStepElement, _document: ArazzoDocument): Promise<ArazzoStepElement> {
    return step;
  }
}

export default ArazzoStepNormalizer;
