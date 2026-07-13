import {
  test as isRuntimeExpression,
  parse as parseRuntimeExpression,
  extract as extractRuntimeExpressions,
} from '@swaggerexpert/arazzo-runtime-expression';

import type ArazzoDocument from '../document/ArazzoDocument.ts';
import OpenAPIDocument from '../document/OpenAPIDocument.ts';
import type DocumentRegistry from '../registry/DocumentRegistry.ts';
import type { OpenAPIOperationElement } from '../document/openapi-types.ts';
import OpenAPIOperationExtractor from '../extractor/OpenAPIOperationExtractor.ts';
import ExtractionError from '../errors/ExtractionError.ts';

/**
 * A resolved operation target: the OpenAPI document that owns the operation and
 * the extracted operation element.
 * @public
 */
export interface OpenAPIOperationTarget {
  readonly document: OpenAPIDocument;
  readonly operation: OpenAPIOperationElement;
}

/**
 * Resolves a step's operation target — the OpenAPI document and operation a
 * step invokes.
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
 * or wrong); a source is classified by what it actually parses to. The resolver
 * acquires the referenced source documents from the registry on demand.
 * @public
 */
class OpenAPIOperationTargetResolver {
  readonly #registry: DocumentRegistry;
  readonly #operationExtractor: OpenAPIOperationExtractor;

  constructor(registry: DocumentRegistry, operationExtractor = new OpenAPIOperationExtractor()) {
    this.#registry = registry;
    this.#operationExtractor = operationExtractor;
  }

  /**
   * Resolves a plain or expression `operationId` to its operation.
   *
   * A whole runtime expression (`$sourceDescriptions.{name}.{operationId}`) is
   * resolved against its named source; a plain name is resolved against the
   * first source description that has it.
   */
  async resolveOperationId(
    operationId: string,
    document: ArazzoDocument,
  ): Promise<OpenAPIOperationTarget> {
    if (isRuntimeExpression(operationId)) {
      return this.#resolveSourced(operationId, document);
    }
    return this.#resolvePlainOperationId(operationId, document);
  }

  /**
   * Resolves an `operationPath` — `{$sourceDescriptions.{name}.url}#/json/pointer`
   * — to its operation.
   */
  async resolveOperationPath(
    operationPath: string,
    document: ArazzoDocument,
  ): Promise<OpenAPIOperationTarget> {
    const hashIndex = operationPath.indexOf('#');
    if (hashIndex === -1) {
      throw new ExtractionError(`operationPath "${operationPath}" is missing a JSON Pointer`, {
        pointer: operationPath,
        uri: document.uri,
      });
    }

    const sourceExpression = operationPath.slice(0, hashIndex);
    const pointer = operationPath.slice(hashIndex + 1);
    const openapiDocument = await this.#resolveSourceDocument(sourceExpression, document);
    const operation = this.#operationExtractor.extractByPointer(openapiDocument, pointer);

    return { document: openapiDocument, operation };
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
    if (!result.success || (tree as { type?: string }).type !== 'SourceDescriptionsExpression') {
      throw new ExtractionError(`Unsupported operationId expression "${expression}"`, {
        operationId: expression,
      });
    }
    const { sourceName, reference } = tree as { sourceName: string; reference: string };
    return { sourceName, reference };
  }

  async #resolveSourced(
    expression: string,
    document: ArazzoDocument,
  ): Promise<OpenAPIOperationTarget> {
    const { sourceName, reference: operationId } =
      this.#parseSourceDescriptionsExpression(expression);
    const openapiDocument = await this.#sourceDocument(sourceName, document);
    const operation = this.#operationExtractor.extract(openapiDocument, operationId);
    return { document: openapiDocument, operation };
  }

  /**
   * Resolves a plain operationId against the first source description that has
   * it. A plain name is only valid when a single (non-arazzo) source is defined,
   * so at most one source can match; the first match is therefore unambiguous.
   * Sources are acquired one at a time until a match is found.
   */
  async #resolvePlainOperationId(
    operationId: string,
    document: ArazzoDocument,
  ): Promise<OpenAPIOperationTarget> {
    for (const uri of document.sourceDescriptionURIs()) {
      const source = await this.#registry.acquire(uri);
      if (!OpenAPIDocument.is(source)) continue;
      if (source.operationIndex.has(operationId)) {
        return {
          document: source,
          operation: this.#operationExtractor.extract(source, operationId),
        };
      }
    }

    throw new ExtractionError(`Operation "${operationId}" not found in any source description`, {
      operationId,
      uri: document.uri,
    });
  }

  /**
   * Resolves an embedded `{$sourceDescriptions.{name}.url}` expression to the
   * source's OpenAPI document.
   *
   * The embedded runtime expression is extracted from the braces, then parsed
   * and asserted to be a `$sourceDescriptions.{name}.url` reference.
   */
  async #resolveSourceDocument(
    sourceExpression: string,
    document: ArazzoDocument,
  ): Promise<OpenAPIDocument> {
    const embedded = extractRuntimeExpressions(sourceExpression);
    if (embedded.length !== 1) {
      throw new ExtractionError(
        `Unsupported operationPath source reference "${sourceExpression}"`,
        { pointer: sourceExpression, uri: document.uri },
      );
    }

    const { sourceName, reference } = this.#parseSourceDescriptionsExpression(embedded[0]);
    if (reference !== 'url') {
      throw new ExtractionError(
        `operationPath source reference "${sourceExpression}" must reference the source's url`,
        { pointer: sourceExpression, uri: document.uri },
      );
    }
    return this.#sourceDocument(sourceName, document);
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

export default OpenAPIOperationTargetResolver;
