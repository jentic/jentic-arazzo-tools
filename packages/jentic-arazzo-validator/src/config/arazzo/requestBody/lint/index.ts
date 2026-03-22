import contentTypeTypeLint from './content-type--type.ts';
import contentTypeFormatLint from './content-type--format.ts';
import replacementsTypeLint from './replacements--type.ts';
import allowedFieldsLint from './allowed-fields.ts';

const lints = [contentTypeTypeLint, contentTypeFormatLint, replacementsTypeLint, allowedFieldsLint];

export default lints;
