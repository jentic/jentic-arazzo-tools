export type { ParseResultElement } from '@speclynx/apidom-datamodel';

export {
  parse as parseArazzo,
  defaultOptions as defaultParseArazzoOptions,
} from './parse-arazzo.ts';
export type { Options as ParseArazzoOptions } from './parse-arazzo.ts';

export {
  parse as parseOpenAPI,
  defaultOptions as defaultParseOpenAPIOptions,
} from './parse-openapi.ts';
export type { Options as ParseOpenAPIOptions } from './parse-openapi.ts';
