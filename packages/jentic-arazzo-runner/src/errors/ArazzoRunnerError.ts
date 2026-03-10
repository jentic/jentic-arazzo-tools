import { ApiDOMError, type ApiDOMErrorOptions } from '@speclynx/apidom-error';

class ArazzoRunnerError extends ApiDOMError {
  constructor(message?: string, options?: ApiDOMErrorOptions) {
    super(message, options);
  }
}

export default ArazzoRunnerError;
