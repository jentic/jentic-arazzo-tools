import type { Metadata } from '@speclynx/apidom-ls';
import configArazzo from './arazzo/config.ts';
import { linterfunctionsMap } from './linter-functions.ts';

/**
 * @public
 */
export function config(): Metadata {
  return {
    metadataMaps: {
      arazzo: configArazzo,
    },
    linterFunctions: linterfunctionsMap,
    symbols: [],
    tokens: [],
  } as Metadata;
}
