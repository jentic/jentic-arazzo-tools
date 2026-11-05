import type { ParseResultElement } from '@speclynx/apidom-datamodel';
import {
  isArazzoSpecification1Element,
  isSourceDescriptionElement,
} from '@speclynx/apidom-ns-arazzo-1';
import {
  isSwaggerElement,
  isPathItemElement as isPathItem2Element,
} from '@speclynx/apidom-ns-openapi-2';
import {
  isOpenApi3_0Element,
  isPathItemElement as isPathItem3Element,
} from '@speclynx/apidom-ns-openapi-3-0';
import { isOpenApi3_1Element } from '@speclynx/apidom-ns-openapi-3-1';

import { dereferenceElement, type Options } from './openapi.ts';

/**
 * Replaces the Path Items that consist of a `$ref` in the `openapi` source descriptions parsed
 * along with an Arazzo Document (see the `sourceDescriptions` parser option) with the Path Items
 * they point to, whether local (`#/components/pathItems/...`) or external.
 *
 * Only Path Items are dereferenced, not the whole OpenAPI Documents, and the source descriptions
 * are modified in place. This makes the operations behind such Path Items discoverable, e.g. by
 * `findStepOperation` of \@jentic/arazzo-parser.
 *
 * This is best effort and never rejects: a Path Item that can't be resolved is left as is.
 *
 * @param parseResult - The result of parsing an Arazzo Document with source descriptions
 * @param options - Reference options (uses defaultOptions when not provided)
 * @returns A promise that resolves once all resolvable Path Items have been replaced
 * @public
 */
export async function dereferenceSourceDescriptionPathItems(
  parseResult: ParseResultElement,
  options: Options = {},
): Promise<void> {
  if (!isArazzoSpecification1Element(parseResult.api)) return;

  const pending: Promise<void>[] = [];

  parseResult.api.sourceDescriptions?.forEach((sourceDescription) => {
    if (!isSourceDescriptionElement(sourceDescription)) return;
    const sourceParseResult = sourceDescription.meta.get('parseResult') as
      ParseResultElement | undefined;
    const api = sourceParseResult?.api;
    if (!sourceParseResult || !api) return;
    if (!isSwaggerElement(api) && !isOpenApi3_0Element(api) && !isOpenApi3_1Element(api)) return;

    api.paths?.forEach((pathItem, key) => {
      if (!isPathItem2Element(pathItem) && !isPathItem3Element(pathItem)) return;
      if (!pathItem.$ref) return;

      pending.push(
        dereferenceElement(pathItem, {
          ...options,
          dereference: {
            ...options.dereference,
            circular: 'replace',
            strategyOpts: { ...options.dereference?.strategyOpts, parseResult: sourceParseResult },
          },
        }).then(
          (dereferenced) => {
            api.paths?.set(String(key.toValue()), dereferenced);
          },
          () => {
            // keep the unresolved Path Item
          },
        ),
      );
    });
  });

  await Promise.all(pending);
}
