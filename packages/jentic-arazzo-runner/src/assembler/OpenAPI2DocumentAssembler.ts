import { toValue } from '@speclynx/apidom-core';
import { isArrayElement, isElement } from '@speclynx/apidom-datamodel';
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

import type OpenAPIDocument from '../document/OpenAPIDocument.ts';
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
  assemble(operation: OperationElement, document: OpenAPIDocument): SwaggerElement {
    const entry = document.parseResult.api;

    if (!isSwaggerElement(entry)) {
      throw new AssemblerError(`Expected OpenAPI 2.0 document at "${document.uri}"`, {
        uri: document.uri,
        operationId: toValue(operation.operationId),
      });
    }

    // build Swagger 2.0 document
    const swagger = new SwaggerElement({ swagger: entry.swagger });
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
    const method = toValue(operation.meta.get('http-method')) as string;
    const path = toValue(operation.meta.get('path')) as string;
    const pathItem = new PathItemElement();
    const paths = new PathsElement();
    pathItem.set(method, operation);
    paths.set(path, pathItem);
    swagger.paths = paths;

    // include only referenced security definitions
    const securityDefinitions = this.#extractReferencedSecurityDefinitions(operation, entry);
    if (securityDefinitions.length > 0) {
      swagger.securityDefinitions = this.#extractReferencedSecurityDefinitions(operation, entry);
    }

    return swagger;
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

    // collect references names of Security Definitions
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
