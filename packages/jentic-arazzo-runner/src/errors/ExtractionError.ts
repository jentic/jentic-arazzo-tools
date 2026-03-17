import ArazzoRunnerError from './ArazzoRunnerError.ts';

/** @public */
class ExtractionError extends ArazzoRunnerError {
  declare readonly workflowId?: string;
  declare readonly stepId?: string;
  declare readonly operationId?: string;
  declare readonly pointer?: string;
  declare readonly uri?: string;
}

export default ExtractionError;
