import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { ApilintCodes } from '@speclynx/apidom-ls';

import arazzoMeta from './arazzo/meta.ts';
import arazzoSpecification1Meta from './arazzo-specification-1/meta.ts';

export default {
  '*': {
    lint: [
      {
        code: ApilintCodes.DUPLICATE_KEYS,
        source: 'apilint',
        message: 'an object cannot contain duplicate keys',
        severity: DiagnosticSeverity.Error,
        linterFunction: 'apilintNoDuplicateKeys',
        marker: 'key',
      },
    ],
  },
  arazzo: arazzoMeta,
  arazzoSpecification1: arazzoSpecification1Meta,
};
