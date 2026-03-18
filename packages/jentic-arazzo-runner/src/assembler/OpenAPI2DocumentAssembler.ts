import { toValue } from '@speclynx/apidom-core';
import { isArrayElement, isElement, ParseResultElement } from '@speclynx/apidom-datamodel';
import { compile } from '@speclynx/apidom-json-pointer';
import {
  SwaggerElement,
  PathsElement,
  PathItemElement,
  SecurityDefinitionsElement,
  isSwaggerElement,
  isSecurityRequirementElement,
  isSecurityDefinitionsElement,
  isSecuritySchemeElement,
  type OperationElement,
} from '@speclynx/apidom-ns-openapi-2';

import OpenAPIDocument from '../document/OpenAPIDocument.ts';
import OpenAPIOperationIndex from '../document/OpenAPIOperationIndex.ts';
import AssemblerError from '../errors/AssemblerError.ts';

/**
 * Assembles a standalone OpenAPI 2.0 (Swagger) document from a
 * normalized operation element.
 *
 * The assembled document is a valid Swagger 2.0 specification containing
 * only the single operation with its host, basePath, schemes, and
 * referenced security definitions from the source document.
 * @public
 */
class OpenAPI2DocumentAssembler {
  /**
   * Assembles a standalone Swagger 2.0 document from a normalized operation.
   */
  assemble(operation: OperationElement, document: OpenAPIDocument): OpenAPIDocument {
    const entry = document.parseResult.api;
    const operationId: unknown = toValue(operation.operationId);
    const method: unknown = toValue(operation.meta.get('http-method'));
    const path: unknown = toValue(operation.meta.get('path'));

    if (typeof operationId !== 'string' || operationId.length === 0) {
      throw new AssemblerError(
        `Operation is missing operationId in document at "${document.uri}"`,
        { uri: document.uri },
      );
    }

    if (typeof method !== 'string' || typeof path !== 'string') {
      throw new AssemblerError(
        `Operation is missing valid "http-method" or "path" metadata. Was it produced by OpenAPIOperationExtractor?`,
        { operationId, uri: document.uri },
      );
    }

    if (!isSwaggerElement(entry)) {
      throw new AssemblerError(`Expected OpenAPI 2.0 document at "${document.uri}"`, {
        operationId,
        uri: document.uri,
      });
    }

    // build Swagger 2.0 document
    const swagger = new SwaggerElement({ swagger: entry.swagger }, { classes: ['api'] });
    // prettier-ignore
    {
      if (isElement(entry.info))         swagger.info = entry.info;
      if (isElement(entry.host))         swagger.host = entry.host;
      if (isElement(entry.basePath))     swagger.basePath = entry.basePath;
      if (isElement(entry.schemes))      swagger.schemes = entry.schemes;
      if (isElement(entry.consumes))     swagger.consumes = entry.consumes;
      if (isElement(entry.produces))     swagger.produces = entry.produces;
      if (isElement(entry.tags))         swagger.tags = entry.tags;
      if (isElement(entry.externalDocs)) swagger.externalDocs = entry.externalDocs;
    }

    // build paths with single operation
    const pathItem = new PathItemElement();
    const paths = new PathsElement();
    pathItem.set(method, operation);
    paths.set(path, pathItem);
    swagger.paths = paths;

    // include only referenced security definitions
    const securityDefinitions = this.#extractReferencedSecurityDefinitions(operation, entry);
    if (securityDefinitions.length > 0) {
      swagger.securityDefinitions = securityDefinitions;
    }

    // wrap in ParseResultElement and return as OpenAPIDocument
    const parseResult = new ParseResultElement([swagger]);
    const operationIndex = new OpenAPIOperationIndex().set(
      operationId,
      compile(['paths', path, method]),
    );

    return new OpenAPIDocument(document.uri, parseResult, operationIndex);
  }

  /**
   * Extracts only the security definitions referenced by the operation's
   * security requirements.
   */
  #extractReferencedSecurityDefinitions(
    operation: OperationElement,
    entry: SwaggerElement,
  ): SecurityDefinitionsElement {
    const securityDefinitions = new SecurityDefinitionsElement();

    if (!isArrayElement(operation.security)) return securityDefinitions;
    if (!isSecurityDefinitionsElement(entry.securityDefinitions)) return securityDefinitions;

    // collect referenced names of Security Definitions
    const referencedNames = new Set<string>();
    for (const securityRequirement of operation.security) {
      if (!isSecurityRequirementElement(securityRequirement)) continue;

      securityRequirement.forEach((_value: unknown, keyElement: unknown) => {
        referencedNames.add(toValue(keyElement) as string);
      });
    }

    if (referencedNames.size === 0) return securityDefinitions;

    for (const name of referencedNames) {
      const securityScheme = entry.securityDefinitions.get(name);
      if (!isSecuritySchemeElement(securityScheme)) continue;
      securityDefinitions.set(name, securityScheme);
    }

    return securityDefinitions;
  }
}

export default OpenAPI2DocumentAssembler;
