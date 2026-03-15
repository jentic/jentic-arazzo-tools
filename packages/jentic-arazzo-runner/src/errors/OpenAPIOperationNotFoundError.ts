import ArazzoRunnerError from './ArazzoRunnerError.ts';

/** @public */
class OpenAPIOperationNotFoundError extends ArazzoRunnerError {
  declare readonly operationId?: string;
  declare readonly pointer?: string;
  declare readonly uri?: string;
}

export default OpenAPIOperationNotFoundError;
