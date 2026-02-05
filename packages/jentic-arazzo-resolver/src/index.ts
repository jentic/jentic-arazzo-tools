export {
  defaultOptions as defaultDereferenceArazzoOptions,
  dereference as dereferenceArazzo,
  dereferenceElement as dereferenceArazzoElement,
  type Options as DereferenceArazzoOptions,
} from './dereference/arazzo.ts';

export {
  defaultOptions as defaultDereferenceOpenAPIOptions,
  dereference as dereferenceOpenAPI,
  dereferenceElement as dereferenceOpenAPIElement,
  type Options as DereferenceOpenAPIOptions,
} from './dereference/openapi.ts';

export { default as DereferenceError } from './errors/DereferenceError.ts';
