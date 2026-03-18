import { toValue } from '@speclynx/apidom-core';
import {
  isArrayElement,
  isElement,
  ObjectElement,
  ParseResultElement,
} from '@speclynx/apidom-datamodel';
import { compile } from '@speclynx/apidom-json-pointer';
import {
  OpenApi3_1Element,
  ComponentsElement,
  PathsElement,
  PathItemElement,
  isOpenApi3_1Element,
  isSecurityRequirementElement,
  isSecuritySchemeElement,
  type OperationElement,
} from '@speclynx/apidom-ns-openapi-3-1';

import OpenAPIDocument from '../document/OpenAPIDocument.ts';
import OpenAPIOperationIndex from '../document/OpenAPIOperationIndex.ts';
import AssemblerError from '../errors/AssemblerError.ts';

/**
 * Assembles a standalone OpenAPI 3.1 document from a
 * normalized operation element.
 *
 * The assembled document is a valid OpenAPI 3.1 specification containing
 * only the single operation with its servers, and referenced security
 * schemes from the source document's components.
 * @public
 */
class OpenAPI31DocumentAssembler {
  /**
   * Assembles a standalone OpenAPI 3.1 document from a normalized operation.
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

    if (!isOpenApi3_1Element(entry)) {
      throw new AssemblerError(`Expected OpenAPI 3.1 document at "${document.uri}"`, {
        operationId,
        uri: document.uri,
      });
    }

    // build OpenAPI 3.1 document
    const openapi = new OpenApi3_1Element({ openapi: entry.openapi }, { classes: ['api'] });
    // prettier-ignore
    {
      if (isElement(entry.info))         openapi.info = entry.info;
      if (isElement(entry.tags))         openapi.tags = entry.tags;
      if (isElement(entry.externalDocs)) openapi.externalDocs = entry.externalDocs;
      if (isElement(entry.jsonSchemaDialect)) openapi.jsonSchemaDialect = entry.jsonSchemaDialect;
    }

    // build paths with single operation
    const pathItem = new PathItemElement();
    const paths = new PathsElement();
    pathItem.set(method, operation);
    paths.set(path, pathItem);
    openapi.paths = paths;

    // include only referenced security schemes in components
    const securitySchemes = this.#extractReferencedSecuritySchemes(operation, entry);
    if (securitySchemes.length > 0) {
      const components = new ComponentsElement();
      components.securitySchemes = securitySchemes;
      openapi.components = components;
    }

    // wrap in ParseResultElement and return as OpenAPIDocument
    const parseResult = new ParseResultElement([openapi]);
    const operationIndex = new OpenAPIOperationIndex().set(
      operationId,
      compile(['paths', path, method]),
    );

    return new OpenAPIDocument(document.uri, parseResult, operationIndex);
  }

  /**
   * Extracts only the security schemes referenced by the operation's
   * security requirements.
   */
  #extractReferencedSecuritySchemes(
    operation: OperationElement,
    entry: OpenApi3_1Element,
  ): ObjectElement {
    const securitySchemes = new ObjectElement();

    if (!isArrayElement(operation.security)) return securitySchemes;
    if (entry.components === undefined) return securitySchemes;
    if (entry.components.securitySchemes === undefined) return securitySchemes;

    // collect referenced names of security schemes
    const referencedNames = new Set<string>();
    for (const securityRequirement of operation.security) {
      if (!isSecurityRequirementElement(securityRequirement)) continue;

      securityRequirement.forEach((_value: unknown, keyElement: unknown) => {
        referencedNames.add(toValue(keyElement) as string);
      });
    }

    if (referencedNames.size === 0) return securitySchemes;

    for (const name of referencedNames) {
      const securityScheme = entry.components.securitySchemes.get(name);
      if (!isSecuritySchemeElement(securityScheme)) continue;
      securitySchemes.set(name, securityScheme);
    }

    return securitySchemes;
  }
}

export default OpenAPI31DocumentAssembler;
