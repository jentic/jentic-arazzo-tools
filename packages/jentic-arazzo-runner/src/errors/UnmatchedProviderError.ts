import ArazzoRunnerError from './ArazzoRunnerError.ts';

/** @public */
class UnmatchedProviderError extends ArazzoRunnerError {
  declare readonly uri?: string;
}

export default UnmatchedProviderError;
