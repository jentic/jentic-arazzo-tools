// Components
export { ArazzoViewer } from './ArazzoViewer';
export { DiagramView } from './components/DiagramView';
export { DocsView } from './components/DocsView';

// Context (for advanced users building custom layouts or editor integration)
export { ArazzoViewerProvider, useArazzoViewer } from './context/ArazzoViewerContext';

// Types
export type {
  // Viewer-specific
  ArazzoViewerProps,
  ArazzoViewerRef,
  ArazzoViewerContextValue,
  ViewerMode,
  ViewerEvents,
  DiagramType,
  // Node types
  ArazzoNode,
  ArazzoNodeData,
  ArazzoNodeType,
  StepNodeData,
  WorkflowRefNodeData,
  StartNodeData,
  EndNodeData,
  WorkflowNodeData,
  ExternalWorkflowNodeData,
  // Edge types
  ArazzoEdge,
  ArazzoEdgeData,
  ArazzoEdgeType,
  SequentialEdgeData,
  SuccessEdgeData,
  FailureEdgeData,
  RetryEdgeData,
  BundledSuccessEdgeData,
  BundledFailureEdgeData,
  BundledRetryEdgeData,
  // Documentation
  DocumentationMetadata,
  WorkflowDocumentation,
  StepDocumentation,
  DocumentationSection,
  DocsViewConfig,
  // Validation
  ValidationError,
  // Conversion
  ConversionOptions,
} from './types/index';

export type {
  // Arazzo spec types
  ArazzoDocument,
  Workflow,
  Step,
  SuccessAction,
  FailureAction,
  Criterion,
  Parameter,
  RequestBody,
  SourceDescription,
  ComponentsObject,
  JSONSchema,
  ReusableObject,
  InfoObject,
} from './types/index';

// Utilities (for advanced users)
export {
  generateDocumentation,
  generateMermaidSequence,
  generateMermaidFlowchart,
} from './utils/documentation/index';

// Styles
import './styles/index.css';
