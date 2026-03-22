import targetRequiredLint from './target--required.ts';
import targetTypeLint from './target--type.ts';
import valueRequiredLint from './value--required.ts';
import allowedFieldsLint from './allowed-fields.ts';

const lints = [targetRequiredLint, targetTypeLint, valueRequiredLint, allowedFieldsLint];

export default lints;
