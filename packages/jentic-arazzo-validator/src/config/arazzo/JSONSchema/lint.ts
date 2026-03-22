import {
  commonSchemaLints,
  jsonSchema202012SchemaLints,
  composeRules,
  assocTargetSpecs,
  ArazzoTargetSpecs,
} from '@speclynx/apidom-ls';
import type { LinterMeta } from '@speclynx/apidom-ls';

const { Arazzo } = ArazzoTargetSpecs;

const arazzoCommonRules = commonSchemaLints.filter((rule: LinterMeta) =>
  rule.targetSpecs?.some((spec) => spec.namespace === 'arazzo'),
);

const schemaLints: LinterMeta[] = [
  ...composeRules([jsonSchema202012SchemaLints], assocTargetSpecs(Arazzo)),
  ...arazzoCommonRules,
];

export default schemaLints;
