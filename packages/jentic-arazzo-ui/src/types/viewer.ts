/**
 * Viewer-specific types for \@jentic/arazzo-ui
 */

import { Node, Edge } from 'reactflow';
import {
  Step,
  Workflow,
  SuccessAction,
  FailureAction,
  Criterion,
  JSONSchema,
  ArazzoDocument,
  ReusableObject,
  Parameter,
} from './arazzo';

// ============================================================================
// Viewer Mode & Events
// ============================================================================

/** @public */
export type ViewerMode = 'diagram' | 'docs' | 'split';

/** @public */
export interface ViewerEvents {
  onNodeSelect?: (nodeId: string, node: ArazzoNode) => void;
  onEdgeSelect?: (edgeId: string, edge: ArazzoEdge) => void;
  onWorkflowSelect?: (workflowId: string) => void;
  onViewChange?: (view: ViewerMode) => void;
}

// ============================================================================
// Component Props & Ref
// ============================================================================

/** @public */
export interface ArazzoUIProps {
  document: ArazzoDocument | string;
  view?: ViewerMode;
  activeWorkflowId?: string | null;
  selectedNodeId?: string | null;
  diagramType?: DiagramType | 'none';
  className?: string;
  style?: React.CSSProperties;
  onNodeSelect?: (nodeId: string, node: ArazzoNode) => void;
  onEdgeSelect?: (edgeId: string, edge: ArazzoEdge) => void;
  onWorkflowSelect?: (workflowId: string) => void;
  onViewChange?: (view: ViewerMode) => void;
}

/** @public */
export interface ArazzoUIRef {
  fitView(): void;
  setZoom(level: number): void;
  getDocument(): ArazzoDocument;
  setActiveWorkflow(workflowId: string | null): void;
  selectStep(stepId: string): void;
  clearSelection(): void;
  getActiveWorkflowId(): string | null;
  getSelectedStepId(): string | null;
}

// ============================================================================
// Context
// ============================================================================

export interface ArazzoViewerContextValue {
  document: ArazzoDocument;
  documentURL: string | null;
  activeWorkflowId: string | null;
  setActiveWorkflow: (id: string | null) => void;
  activeWorkflow: Workflow | null;
  selectedNodeId: string | null;
  setSelectedNode: (id: string | null) => void;
  nodes: ArazzoNode[];
  edges: ArazzoEdge[];
  setNodes: (nodes: ArazzoNode[]) => void;
  setEdges: (edges: ArazzoEdge[]) => void;
  readOnly: boolean;
  events?: ViewerEvents;
}

// ============================================================================
// Documentation Types
// ============================================================================

/** @public */
export type DiagramType = 'sequence' | 'flowchart';

/** @public */
export interface DocsViewConfig {
  includeMetadata?: boolean;
  includeDiagrams?: boolean;
  diagramType?: DiagramType;
}

/** @public */
export interface DocumentationMetadata {
  title: string;
  version: string;
  arazzoVersion: string;
  documentURL?: string | null;
  summary?: string;
  description?: string;
  sourceDescriptions: Array<{
    name: string;
    url: string;
    type?: string;
  }>;
}

/** @public */
export interface WorkflowDocumentation {
  workflowId: string;
  summary?: string;
  description?: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  steps: StepDocumentation[];
  successActions?: (SuccessAction | ReusableObject)[];
  failureActions?: (FailureAction | ReusableObject)[];
}

/** @public */
export interface StepDocumentation {
  stepId: string;
  description?: string;
  operationId?: string;
  operationPath?: string;
  workflowId?: string;
  parameters?: (Parameter | ReusableObject)[];
  outputs?: Record<string, string>;
  successCriteria?: Criterion[];
  onSuccess?: (SuccessAction | ReusableObject)[];
  onFailure?: (FailureAction | ReusableObject)[];
}

/** @public */
export interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  level: number;
}

// ============================================================================
// Node Types
// ============================================================================

/** @public */
export type ArazzoNodeType = 'start' | 'end' | 'step' | 'workflowRef' | 'workflow' | 'externalWorkflow';

/** @public */
export interface StepNodeData {
  type: 'step';
  step: Step;
  workflowId: string;
  workflowSuccessActions?: (SuccessAction | { $ref: string })[];
  workflowFailureActions?: (FailureAction | { $ref: string })[];
  isValid: boolean;
  errors?: ValidationError[];
  isSelected?: boolean;
  isHighlighted?: boolean;
}

/** @public */
export interface WorkflowRefNodeData {
  type: 'workflowRef';
  step: Step;
  targetWorkflowId: string;
  workflowSuccessActions?: (SuccessAction | ReusableObject)[];
  workflowFailureActions?: (FailureAction | ReusableObject)[];
  isValid: boolean;
}

/** @public */
export interface StartNodeData {
  type: 'start';
  workflowId: string;
  inputs?: JSONSchema;
  description?: string;
}

/** @public */
export interface EndNodeData {
  type: 'end';
  workflowId: string;
  outputs?: Record<string, string>;
}

/** @public */
export interface WorkflowNodeData {
  type: 'workflow';
  workflow: Workflow;
  onClick?: (workflowId: string) => void;
}

/** @public */
export interface ExternalWorkflowNodeData {
  type: 'externalWorkflow';
  workflowId: string;
  workflow?: Workflow;
  onClick?: (workflowId: string) => void;
}

/** @public */
export type ArazzoNodeData =
  | StepNodeData
  | WorkflowRefNodeData
  | StartNodeData
  | EndNodeData
  | WorkflowNodeData
  | ExternalWorkflowNodeData;

/** @public */
export type ArazzoNode = Node<ArazzoNodeData>;

// ============================================================================
// Edge Types
// ============================================================================

/** @public */
export type ArazzoEdgeType = 'sequential' | 'success' | 'failure' | 'retry' | 'bundled-success' | 'bundled-failure' | 'bundled-retry';

/** @public */
export interface SequentialEdgeData {
  type: 'sequential';
}

/** @public */
export interface SuccessEdgeData {
  type: 'success';
  action: SuccessAction;
  criteria?: Criterion[];
  isInherited?: boolean;
}

/** @public */
export interface FailureEdgeData {
  type: 'failure';
  action: FailureAction;
  criteria?: Criterion[];
  isInherited?: boolean;
}

/** @public */
export interface RetryEdgeData {
  type: 'retry';
  action: FailureAction;
  retryAfter?: number;
  retryLimit?: number;
  criteria?: Criterion[];
  isInherited?: boolean;
}

/** @public */
export interface BundledSuccessEdgeData {
  type: 'bundled-success';
  action: SuccessAction;
  criteria?: Criterion[];
  sources: Array<{ nodeId: string; handleId: string }>;
  actionIdx: number;
}

/** @public */
export interface BundledFailureEdgeData {
  type: 'bundled-failure';
  action: FailureAction;
  criteria?: Criterion[];
  sources: Array<{ nodeId: string; handleId: string }>;
  actionIdx: number;
}

/** @public */
export interface BundledRetryEdgeData {
  type: 'bundled-retry';
  action: FailureAction;
  retryAfter?: number;
  retryLimit?: number;
  criteria?: Criterion[];
  sources: Array<{ nodeId: string; handleId: string }>;
  actionIdx: number;
}

/** @public */
export type ArazzoEdgeData =
  | SequentialEdgeData
  | SuccessEdgeData
  | FailureEdgeData
  | RetryEdgeData
  | BundledSuccessEdgeData
  | BundledFailureEdgeData
  | BundledRetryEdgeData;

/** @public */
export type ArazzoEdge = Edge<ArazzoEdgeData>;

// ============================================================================
// Validation
// ============================================================================

/** @public */
export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
  nodeId?: string;
  edgeId?: string;
  specRef?: string;
}

// ============================================================================
// Conversion Options
// ============================================================================

/** @public */
export interface ConversionOptions {
  autoLayout?: boolean;
  layout?: {
    direction?: 'TB' | 'LR';
    nodeSpacing?: number;
    rankSpacing?: number;
  };
}
