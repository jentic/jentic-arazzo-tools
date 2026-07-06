import ArazzoRunnerError from './ArazzoRunnerError.ts';

/** @public */
class RuntimeExpressionError extends ArazzoRunnerError {
  declare readonly expression?: string;
  declare readonly reason?: string;
}

export default RuntimeExpressionError;
