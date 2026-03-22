import arazzoRequiredLint from './arazzo--required.ts';
import arazzoTypeLint from './arazzo--type.ts';
import arazzoPatternLint from './arazzo--pattern.ts';
import infoRequiredLint from './info--required.ts';
import infoTypeLint from './info--type.ts';
import sourceDescriptionsRequiredLint from './source-descriptions--required.ts';
import sourceDescriptionsTypeLint from './source-descriptions--type.ts';
import sourceDescriptionsNonEmptyLint from './source-descriptions--non-empty.ts';
import workflowsRequiredLint from './workflows--required.ts';
import workflowsTypeLint from './workflows--type.ts';
import workflowsNonEmptyLint from './workflows--non-empty.ts';
import componentsTypeLint from './components--type.ts';
import allowedFieldsLint from './allowed-fields.ts';

const lints = [
  arazzoRequiredLint,
  arazzoTypeLint,
  arazzoPatternLint,
  infoRequiredLint,
  infoTypeLint,
  sourceDescriptionsRequiredLint,
  sourceDescriptionsTypeLint,
  sourceDescriptionsNonEmptyLint,
  workflowsRequiredLint,
  workflowsTypeLint,
  workflowsNonEmptyLint,
  componentsTypeLint,
  allowedFieldsLint,
];

export default lints;
