import ArazzoRunnerError from './ArazzoRunnerError.ts';

/** @public */
class ArazzoWorkflowNotFoundError extends ArazzoRunnerError {
  declare readonly workflowId?: string;
  declare readonly pointer?: string;
  declare readonly uri?: string;
}

export default ArazzoWorkflowNotFoundError;
