import {
  test as isRuntimeExpression,
  parse as parseRuntimeExpression,
} from '@swaggerexpert/arazzo-runtime-expression';
import { URIFragmentIdentifier, testJSONPointer } from '@swaggerexpert/json-pointer';
import { url } from '@speclynx/apidom-reference/configuration/empty';

import type ArazzoDocument from '../document/ArazzoDocument.ts';
import OpenAPIDocument from '../document/OpenAPIDocument.ts';
import type DocumentRegistry from '../registry/DocumentRegistry.ts';
import RuntimeExpressionEvaluator from '../expression/RuntimeExpressionEvaluator.ts';
import ExtractionError from '../errors/ExtractionError.ts';

/**
 * A canonical OpenAPI operation locator: the OpenAPI document that owns the
 * operation and a JSON Pointer locating the operation within it
 * (`/paths/{path}/{method}`).
 *
 * A step names its operation in one of several ways — a plain `operationId`, a
 * `$sourceDescriptions` runtime expression, or an `operationPath` — which are
 * all locators for the same thing. The normalizer reduces any of them to this
 * single canonical form.
 * @public
 */
export interface OpenAPIOperationLocator {
  readonly document: OpenAPIDocument;
  readonly jsonPointer: string;
}

/**
 * Normalizes a step's OpenAPI operation locator to a canonical
 * {@link OpenAPIOperationLocator} — the OpenAPI document and a JSON Pointer to
 * the operation within it.
 *
 * A step names its operation with either `operationId` or `operationPath`:
 * - `operationId` is a plain operation name, or a whole runtime expression
 *   `$sourceDescriptions.{name}.{operationId}`. Per the Arazzo Specification, a
 *   plain name is only valid when a single (non-arazzo) source description is
 *   defined; multiple sources require the expression form. A plain name is
 *   therefore resolved against the first source description that has it.
 * - `operationPath` embeds a `{$sourceDescriptions.{name}.url}` runtime
 *   expression followed by a JSON Pointer to the operation.
 *
 * The `type` declared on a source description is not trusted (it may be absent
 * or wrong); a source is classified by what it actually parses to. The
 * normalizer acquires the referenced source documents from the registry on
 * demand.
 * @public
 */
class OpenAPIOperationLocatorNormalizer {
  readonly #registry: DocumentRegistry;

  constructor(registry: DocumentRegistry) {
    this.#registry = registry;
  }

  /**
   * Normalizes a plain or expression `operationId` to a canonical locator.
   *
   * A whole runtime expression (`$sourceDescriptions.{name}.{operationId}`) is
   * resolved against its named source; a plain name is resolved against the
   * first source description that has it.
   */
  async normalizeOperationId(
    operationId: string,
    document: ArazzoDocument,
  ): Promise<OpenAPIOperationLocator> {
    if (isRuntimeExpression(operationId)) {
      return this.#resolveSourced(operationId, document);
    }
    return this.#resolvePlainOperationId(operationId, document);
  }

  /**
   * Normalizes an `operationPath` —
   * `{$sourceDescriptions.{name}.url}#/json/pointer` — to a canonical locator.
   *
   * The reference is interpolated (resolving
   * `{$sourceDescriptions.{name}.url}` to the source's URL) into a URI
   * reference; its fragment is the JSON Pointer to the operation (decoded from
   * the URI fragment representation) and the part before the fragment is the
   * source document to acquire.
   *
   * The runner only needs a URL and a JSON Pointer, so it does not enforce that
   * the source description is identified by a runtime expression rather than a
   * literal URL (a literal URL interpolates to itself and still resolves) — that
   * is a conformance concern for the validator. It fails only when the URL does
   * not resolve to an OpenAPI source or the JSON Pointer is invalid.
   */
  async normalizeOperationPath(
    operationPath: string,
    document: ArazzoDocument,
  ): Promise<OpenAPIOperationLocator> {
    const evaluator = new RuntimeExpressionEvaluator(
      {},
      { strict: false, document, registry: this.#registry },
    );
    const uriReference = evaluator.interpolate(operationPath);

    const documentURI = url.sanitize(url.stripHash(uriReference));
    if (documentURI === '') {
      throw new ExtractionError(
        `operationPath "${operationPath}" does not resolve to a source description URL`,
        { pointer: operationPath, uri: document.uri },
      );
    }

    const jsonPointer = URIFragmentIdentifier.fromURIReference(uriReference);
    if (!testJSONPointer(jsonPointer)) {
      throw new ExtractionError(`operationPath "${operationPath}" has an invalid JSON Pointer`, {
        pointer: operationPath,
        uri: document.uri,
      });
    }

    const source = await this.#registry.acquire(documentURI);
    if (!OpenAPIDocument.is(source)) {
      throw new ExtractionError(
        `operationPath "${operationPath}" does not reference an OpenAPI document`,
        { pointer: operationPath, uri: documentURI },
      );
    }

    return { document: source, jsonPointer };
  }

  /**
   * Parses a `$sourceDescriptions.{name}.{reference}` expression to its AST,
   * asserting it is a source-descriptions expression.
   */
  #parseSourceDescriptionsExpression(expression: string): {
    sourceName: string;
    reference: string;
  } {
    const { result, tree } = parseRuntimeExpression(expression);
    if (!result.success || tree.type !== 'SourceDescriptionsExpression') {
      throw new ExtractionError(`Unsupported operationId expression "${expression}"`, {
        operationId: expression,
      });
    }
    const { sourceName, reference } = tree;
    return { sourceName, reference };
  }

  async #resolveSourced(
    expression: string,
    document: ArazzoDocument,
  ): Promise<OpenAPIOperationLocator> {
    const { sourceName, reference: operationId } =
      this.#parseSourceDescriptionsExpression(expression);
    const openapiDocument = await this.#sourceDocument(sourceName, document);
    const jsonPointer = openapiDocument.operationIndex.get(operationId);
    if (jsonPointer === undefined) {
      throw new ExtractionError(
        `Operation "${operationId}" not found in source description "${sourceName}"`,
        { operationId, uri: openapiDocument.uri },
      );
    }
    return { document: openapiDocument, jsonPointer };
  }

  /**
   * Resolves a plain operationId against the single OpenAPI source description.
   *
   * Per the Arazzo Specification a plain operationId is only valid when a single
   * non-arazzo source description is defined; multiple such sources require the
   * `$sourceDescriptions` expression form. The first OpenAPI source is therefore
   * the one it targets: the operationId is looked up there and the lookup fails
   * if it is absent — subsequent OpenAPI sources are not searched (their
   * presence would make the plain operationId ambiguous, and hence invalid).
   * Non-OpenAPI (arazzo) sources are skipped. Sources are acquired one at a time
   * until the first OpenAPI source is reached.
   */
  async #resolvePlainOperationId(
    operationId: string,
    document: ArazzoDocument,
  ): Promise<OpenAPIOperationLocator> {
    for (const uri of document.sourceDescriptionURIs()) {
      const source = await this.#registry.acquire(uri);
      if (!OpenAPIDocument.is(source)) continue;

      const jsonPointer = source.operationIndex.get(operationId);
      if (jsonPointer === undefined) {
        throw new ExtractionError(
          `Operation "${operationId}" not found in source description at "${source.uri}"`,
          { operationId, uri: source.uri },
        );
      }
      return { document: source, jsonPointer };
    }

    throw new ExtractionError(`Operation "${operationId}" has no OpenAPI source description`, {
      operationId,
      uri: document.uri,
    });
  }

  /**
   * Acquires a source description by name and asserts it is an OpenAPI document.
   */
  async #sourceDocument(sourceName: string, document: ArazzoDocument): Promise<OpenAPIDocument> {
    const uri = document.resolveSourceDescriptionURI(sourceName);
    if (uri === undefined) {
      throw new ExtractionError(`Source description "${sourceName}" not found`, {
        uri: document.uri,
      });
    }
    const source = await this.#registry.acquire(uri);
    if (!OpenAPIDocument.is(source)) {
      throw new ExtractionError(`Source description "${sourceName}" is not an OpenAPI document`, {
        uri,
      });
    }
    return source;
  }
}

export default OpenAPIOperationLocatorNormalizer;
