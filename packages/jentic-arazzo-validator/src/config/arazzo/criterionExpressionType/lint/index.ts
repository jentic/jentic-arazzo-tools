import typeRequiredLint from './type--required.ts';
import typeTypeLint from './type--type.ts';
import typeEqualsLint from './type--equals.ts';
import versionRequiredLint from './version--required.ts';
import versionTypeLint from './version--type.ts';
import allowedFieldsLint from './allowed-fields.ts';

const lints = [
  typeRequiredLint,
  typeTypeLint,
  typeEqualsLint,
  versionRequiredLint,
  versionTypeLint,
  allowedFieldsLint,
];

export default lints;
