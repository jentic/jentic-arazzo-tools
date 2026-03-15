/* Document Registry */
export {
  default as DocumentRegistry,
  type DocumentRegistryOptions,
} from './registry/DocumentRegistry.ts';

/* Document Registry Providers */
export { default as DocumentRegistryProvider } from './registry/providers/DocumentRegistryProvider.ts';
export type { DocumentRegistryProviderOptions } from './registry/providers/DocumentRegistryProvider.ts';
export { default as ArazzoDocumentRegistryProvider } from './registry/providers/ArazzoDocumentRegistryProvider.ts';
export type { ArazzoDocumentRegistryProviderOptions } from './registry/providers/ArazzoDocumentRegistryProvider.ts';
export { default as OpenAPIDocumentRegistryProvider } from './registry/providers/OpenAPIDocumentRegistryProvider.ts';
export type { OpenAPIDocumentRegistryProviderOptions } from './registry/providers/OpenAPIDocumentRegistryProvider.ts';

/* Documents */
export { default as APIDocument } from './document/APIDocument.ts';
export { default as ArazzoDocument } from './document/ArazzoDocument.ts';
export { default as OpenAPIDocument } from './document/OpenAPIDocument.ts';
export type { OpenAPIOperationElement, OpenAPIPathItemElement } from './document/openapi-types.ts';

/* Indexes */
export { default as ArazzoWorkflowIndex, type WorkflowId } from './document/ArazzoWorkflowIndex.ts';
export {
  default as OpenAPIOperationIndex,
  type OperationId,
} from './document/OpenAPIOperationIndex.ts';

/* Extractors */
export { default as ArazzoWorkflowExtractor } from './extractor/ArazzoWorkflowExtractor.ts';
export { default as OpenAPIOperationExtractor } from './extractor/OpenAPIOperationExtractor.ts';

/* Normalizers */
export { default as ArazzoWorkflowNormalizer } from './normalizer/ArazzoWorkflowNormalizer.ts';
export type { ArazzoWorkflowNormalizerOptions } from './normalizer/ArazzoWorkflowNormalizer.ts';

/* Errors */
export { default as ArazzoRunnerError } from './errors/ArazzoRunnerError.ts';
export { default as NormalizationError } from './errors/NormalizationError.ts';
export { default as ExtractionError } from './errors/ExtractionError.ts';
export { default as InvalidEntryDocumentError } from './errors/InvalidEntryDocumentError.ts';
export { default as UnmatchedProviderError } from './errors/UnmatchedProviderError.ts';
