import ArazzoRunnerError from './ArazzoRunnerError.ts';

/** @public */
class CriterionError extends ArazzoRunnerError {
  declare readonly condition?: string;
  declare readonly type?: string;
  declare readonly reason?: string;
}

export default CriterionError;
