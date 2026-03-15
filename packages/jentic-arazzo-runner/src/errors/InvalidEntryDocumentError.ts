import ArazzoRunnerError from './ArazzoRunnerError.ts';

/** @public */
class InvalidEntryDocumentError extends ArazzoRunnerError {
  declare readonly uri?: string;
}

export default InvalidEntryDocumentError;
