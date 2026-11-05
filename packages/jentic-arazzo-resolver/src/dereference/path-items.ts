import {
  cloneShallow,
  isArrayElement,
  isObjectElement,
  isStringElement,
  type Element,
  type ParseResultElement,
} from '@speclynx/apidom-datamodel';
import { mergeOptions, parse, url } from '@speclynx/apidom-reference/configuration/empty';
import type { ApiDOMReferenceOptions } from '@speclynx/apidom-reference/configuration/empty';
import {
  isArazzoSpecification1Element,
  isSourceDescriptionElement,
} from '@speclynx/apidom-ns-arazzo-1';
import {
  isSwaggerElement,
  isPathItemElement as isPathItem2Element,
  refractPathItem as refractPathItem2,
} from '@speclynx/apidom-ns-openapi-2';
import {
  isOpenApi3_0Element,
  isPathItemElement as isPathItem3Element,
  refractPathItem as refractPathItem3_0,
} from '@speclynx/apidom-ns-openapi-3-0';
import {
  isOpenApi3_1Element,
  refractPathItem as refractPathItem3_1,
} from '@speclynx/apidom-ns-openapi-3-1';

import { defaultOptions as defaultOpenAPIOptions, type Options } from './openapi.ts';

type PathItem = Element & { $ref?: Element };

const isPathItem = (element: unknown): element is PathItem =>
  isPathItem2Element(element) || isPathItem3Element(element);

const MAX_REF_CHAIN = 20;

// evaluates the JSON Pointer of a URI fragment against an element tree
const evaluateFragment = (root: Element, fragment: string): Element | undefined => {
  const tokens = fragment
    .replace(/^#/, '')
    .split('/')
    .slice(1)
    .map((token) => decodeURIComponent(token).replace(/~1/g, '/').replace(/~0/g, '~'));
  let current: Element | undefined = root;

  for (const token of tokens) {
    if (isObjectElement(current)) current = current.get(token);
    else if (isArrayElement(current)) current = current.get(Number(token));
    else return undefined;
  }

  return current;
};

const refractorFor = (api: unknown) => {
  if (isSwaggerElement(api)) return refractPathItem2;
  if (isOpenApi3_0Element(api)) return refractPathItem3_0;
  if (isOpenApi3_1Element(api)) return refractPathItem3_1;
  return undefined;
};

/**
 * Replaces the Path Items that consist of a `$ref` in the `openapi` source descriptions parsed
 * along with an Arazzo Document (see the `sourceDescriptions` parser option) with the Path Items
 * they point to, whether local (`#/components/pathItems/...`) or external.
 *
 * Only the chain of Path Item `$ref`s is followed. Nothing inside the referenced Path Items
 * (responses, schemas, ...) is dereferenced, so an unrelated nested reference that can't be
 * resolved never hides the operations. The source descriptions are modified in place, which makes
 * the operations behind such Path Items discoverable, e.g. by `findStepOperation` of
 * \@jentic/arazzo-parser.
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

  const mergedOptions = mergeOptions(
    defaultOpenAPIOptions as ApiDOMReferenceOptions,
    options,
  ) as ApiDOMReferenceOptions;
  // external documents are fetched once, however many Path Items point into them
  const documents = new Map<string, Promise<ParseResultElement>>();
  const fetchDocument = (uri: string) => {
    if (!documents.has(uri)) documents.set(uri, parse(uri, mergedOptions));
    return documents.get(uri)!;
  };
  const pending: Promise<void>[] = [];

  parseResult.api.sourceDescriptions?.forEach((sourceDescription) => {
    if (!isSourceDescriptionElement(sourceDescription)) return;
    const sourceParseResult = sourceDescription.meta.get('parseResult') as
      ParseResultElement | undefined;
    const api = sourceParseResult?.api;
    const sourceURI = sourceParseResult?.meta.get('retrievalURI') as string | undefined;
    if (!isSwaggerElement(api) && !isOpenApi3_0Element(api) && !isOpenApi3_1Element(api)) return;
    const refract = refractorFor(api);
    if (!refract || !sourceURI) return;

    // follows the `$ref` of a Path Item to the Path Item it points to
    const follow = async (
      pathItem: PathItem,
      baseURI: string,
      root: Element,
      visited: Set<string>,
    ): Promise<PathItem | undefined> => {
      if (!isStringElement(pathItem.$ref)) return pathItem;

      const ref = pathItem.$ref.toValue() as string;
      const documentURI = url.resolve(baseURI, url.stripHash(ref));
      const fragment = url.getHash(ref);
      const key = `${documentURI}${fragment}`;
      if (visited.has(key) || visited.size >= MAX_REF_CHAIN) return undefined;
      visited.add(key);

      let targetRoot = root;
      if (documentURI !== url.stripHash(baseURI)) {
        const document = await fetchDocument(documentURI);
        targetRoot = isObjectElement(document.api) ? document.api : document.result!;
      }
      const evaluated = evaluateFragment(targetRoot, fragment);
      const target = isPathItem(evaluated) ? evaluated : refract(evaluated);
      if (!isPathItem(target)) return undefined;

      // fields next to the `$ref` override the ones of the referenced Path Item
      const merged = cloneShallow(target) as PathItem & {
        set: (key: string, value: unknown) => unknown;
      };
      if (isObjectElement(pathItem)) {
        pathItem.forEach((value, member) => {
          const name = String(member.toValue());
          if (name !== '$ref') merged.set(name, value);
        });
      }

      return follow(merged, documentURI, targetRoot, visited);
    };

    api.paths?.forEach((pathItem, member) => {
      if (!isPathItem(pathItem) || !pathItem.$ref) return;

      pending.push(
        follow(pathItem, sourceURI, api, new Set()).then(
          (resolved) => {
            if (resolved) api.paths?.set(String(member.toValue()), resolved);
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
