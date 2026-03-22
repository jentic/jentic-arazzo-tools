import nameRequiredLint from './name--required.ts';
import nameTypeLint from './name--type.ts';
import namePatternLint from './name--pattern.ts';
import urlRequiredLint from './url--required.ts';
import urlTypeLint from './url--type.ts';
import typeTypeLint from './type--type.ts';
import typeEqualsLint from './type--equals.ts';
import allowedFieldsLint from './allowed-fields.ts';

const lints = [
  nameRequiredLint,
  nameTypeLint,
  namePatternLint,
  urlRequiredLint,
  urlTypeLint,
  typeTypeLint,
  typeEqualsLint,
  allowedFieldsLint,
];

export default lints;
