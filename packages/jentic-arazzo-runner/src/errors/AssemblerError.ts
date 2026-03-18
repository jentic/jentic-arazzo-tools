import ArazzoRunnerError from './ArazzoRunnerError.ts';

/** @public */
class AssemblerError extends ArazzoRunnerError {
  declare readonly operationId?: string;
  declare readonly uri?: string;
}

export default AssemblerError;
