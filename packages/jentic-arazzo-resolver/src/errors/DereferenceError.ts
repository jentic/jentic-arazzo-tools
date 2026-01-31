import { ApiDOMError, type ApiDOMErrorOptions } from '@speclynx/apidom-error';

/**
 * Error thrown when dereferencing an Arazzo document or element fails.
 * @public
 */
class DereferenceError extends ApiDOMError {
  constructor(message?: string, options?: ApiDOMErrorOptions) {
    super(message, options);
  }
}

export default DereferenceError;
