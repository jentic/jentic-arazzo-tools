import ArazzoRunnerError from './ArazzoRunnerError.ts';

/** @public */
class NormalizationError extends ArazzoRunnerError {
  declare readonly workflowId?: string;
  declare readonly operationId?: string;
  declare readonly uri?: string;
}

export default NormalizationError;
