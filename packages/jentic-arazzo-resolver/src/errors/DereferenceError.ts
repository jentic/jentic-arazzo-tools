import { ApiDOMError, type ApiDOMErrorOptions } from '@speclynx/apidom-error';

class DereferenceError extends ApiDOMError {
  constructor(message?: string, options?: ApiDOMErrorOptions) {
    super(message, options);
  }
}

export default DereferenceError;
