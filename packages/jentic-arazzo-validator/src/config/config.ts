import { Metadata } from '@speclynx/apidom-ls';
import configArazzo from './arazzo/config.ts';

/**
 * @public
 */
export function config(): Metadata {
  return {
    metadataMaps: {
      arazzo: configArazzo,
    },
    linterFunctions: {},
    symbols: [],
    tokens: [],
  } as Metadata;
}
