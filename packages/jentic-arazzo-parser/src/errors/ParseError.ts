import { ApiDOMError, type ApiDOMErrorOptions } from '@speclynx/apidom-error';

class ParseError extends ApiDOMError {
  constructor(message?: string, options?: ApiDOMErrorOptions) {
    super(message, options);
  }
}

export default ParseError;
