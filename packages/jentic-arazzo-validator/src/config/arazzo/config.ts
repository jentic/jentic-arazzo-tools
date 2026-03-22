import { DiagnosticSeverity } from 'vscode-languageserver-types';

import arazzoSpecification1Meta from './arazzoSpecification1/meta.ts';
import infoMeta from './info/meta.ts';
import sourceDescriptionMeta from './sourceDescription/meta.ts';
import workflowMeta from './workflow/meta.ts';
import stepMeta from './step/meta.ts';
import parameterMeta from './parameter/meta.ts';
import successActionMeta from './successAction/meta.ts';
import failureActionMeta from './failureAction/meta.ts';
import componentsMeta from './components/meta.ts';
import criterionMeta from './criterion/meta.ts';
import criterionExpressionTypeMeta from './criterionExpressionType/meta.ts';
import requestBodyMeta from './requestBody/meta.ts';
import payloadReplacementMeta from './payloadReplacement/meta.ts';
import reusableMeta from './reusable/meta.ts';
import schemaMeta from './JSONSchema/meta.ts';
import ApilintCodes from '../codes.ts';

export default {
  '*': {
    lint: [
      {
        code: ApilintCodes.DUPLICATE_KEYS,
        source: 'apilint',
        message: 'an object cannot contain duplicate keys',
        severity: DiagnosticSeverity.Error,
        linterFunction: 'apilintNoDuplicateKeys',
        marker: 'key',
      },
      {
        code: ApilintCodes.ARAZZO_SPEC_NO_SCRIPT_TAGS,
        source: 'apilint',
        message: 'Markdown description must not contain "<script>" tags.',
        severity: DiagnosticSeverity.Error,
        linterFunction: 'apilintValueRegex',
        linterParams: ['<[sS][cC][rR][iI][pP][tT]'],
        negate: true,
        target: 'description',
        marker: 'value',
        markerTarget: 'description',
        data: {},
      },
      {
        code: ApilintCodes.ARAZZO_SPEC_NO_SCRIPT_TAGS,
        source: 'apilint',
        message: 'Markdown title must not contain "<script>" tags.',
        severity: DiagnosticSeverity.Error,
        linterFunction: 'apilintValueRegex',
        linterParams: ['<[sS][cC][rR][iI][pP][tT]'],
        negate: true,
        target: 'title',
        marker: 'value',
        markerTarget: 'title',
        data: {},
      },
    ],
  },
  arazzoSpecification1: arazzoSpecification1Meta,
  info: infoMeta,
  sourceDescription: sourceDescriptionMeta,
  workflow: workflowMeta,
  step: stepMeta,
  parameter: parameterMeta,
  successAction: successActionMeta,
  failureAction: failureActionMeta,
  components: componentsMeta,
  criterion: criterionMeta,
  criterionExpressionType: criterionExpressionTypeMeta,
  requestBody: requestBodyMeta,
  payloadReplacement: payloadReplacementMeta,
  reusable: reusableMeta,
  JSONSchema: schemaMeta,
};
