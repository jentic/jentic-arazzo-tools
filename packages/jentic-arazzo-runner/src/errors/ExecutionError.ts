import ArazzoRunnerError from './ArazzoRunnerError.ts';

/** @public */
class ExecutionError extends ArazzoRunnerError {
  declare readonly stepId?: string;
  declare readonly reason?: string;
}

export default ExecutionError;
