import type { ArazzoStepElement } from '../document/arazzo-types.ts';
import type ArazzoDocument from '../document/ArazzoDocument.ts';

/**
 * Normalizes an extracted Arazzo step.
 *
 * Currently acts as an identity function. Future versions may
 * dereference step-level $ref references or merge inherited properties.
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
