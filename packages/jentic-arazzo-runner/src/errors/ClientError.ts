import ArazzoRunnerError from './ArazzoRunnerError.ts';

/** @public */
class ClientError extends ArazzoRunnerError {
  declare readonly operationId?: string;
  declare readonly operationPath?: string;
  declare readonly uri?: string;
}

export default ClientError;
