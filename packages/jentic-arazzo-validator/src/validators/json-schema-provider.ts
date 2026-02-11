import type { Diagnostic } from 'vscode-languageserver-types';
import {
  Arazzo1JsonSchemaValidationProvider as BaseArazzo1JsonSchemaValidationProvider,
  type ValidationContext,
} from '@speclynx/apidom-ls';

/**
 * Custom JSON Schema validation provider that assigns proper diagnostic codes.
 *
 * Extends the base Arazzo1JsonSchemaValidationProvider to set 'json-schema'
 * as the code for all diagnostics, making them identifiable in CLI output.
 *
 * @internal
 */
export class Arazzo1JsonSchemaValidationProvider extends BaseArazzo1JsonSchemaValidationProvider {
  public override validate(
    jsonDocument: string,
    originalDocument: string,
    isYaml: boolean,
    diagnostics: Diagnostic[],
    validationContext?: ValidationContext,
  ): void {
    super.validate(jsonDocument, originalDocument, isYaml, diagnostics, validationContext);

    // assign 'json-schema' code to all diagnostics
    for (const diagnostic of diagnostics) {
      diagnostic.code = 'json-schema';
    }
  }
}
