import type { ApiDOMErrorOptions } from '@speclynx/apidom-error';

import ArazzoRunnerError from './ArazzoRunnerError.ts';

interface ArazzoDocumentErrorOptions extends ApiDOMErrorOptions {
  readonly document?: string | Record<string, unknown>;
}

class ArazzoDocumentError extends ArazzoRunnerError {
  declare readonly document?: string | Record<string, unknown>;

  constructor(message?: string, options?: ArazzoDocumentErrorOptions) {
    super(message, options);
  }
}

export default ArazzoDocumentError;
