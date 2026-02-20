import { ArazzoDocument } from '../../types/arazzo';
import { DocumentationMetadata, WorkflowDocumentation } from '../../types/viewer';
import { generateMetadata } from './metadataGenerator';
import {
  formatAsMarkdown,
  formatHeaderAsMarkdown,
  formatWorkflowAsMarkdown,
} from './markdownFormatter';

export interface GenerateDocumentationOptions {
  includeMetadata?: boolean;
  includeDiagrams?: boolean;
  documentURL?: string | null;
}

export interface DocumentationOutput {
  metadata: DocumentationMetadata;
  workflows: WorkflowDocumentation[];
  markdown: string;
  headerMarkdown: string;
  workflowMarkdowns: Map<string, string>;
}

/**
 * Generates complete documentation from an Arazzo document
 */
export function generateDocumentation(
  document: ArazzoDocument,
  options: GenerateDocumentationOptions = {},
): DocumentationOutput {
  const { includeMetadata = true, includeDiagrams = false, documentURL } = options;

  // Extract metadata
  const metadata = generateMetadata(document);
  metadata.documentURL = documentURL;

  // Generate workflow documentation
  const workflows: WorkflowDocumentation[] = document.workflows.map((workflow) => ({
    workflowId: workflow.workflowId,
    summary: workflow.summary,
    description: workflow.description,
    inputs: workflow.inputs,
    outputs: workflow.outputs,
    steps: workflow.steps.map((step) => ({
      stepId: step.stepId,
      description: step.description,
      operationId: step.operationId,
      operationPath: step.operationPath,
      workflowId: step.workflowId,
      parameters: step.parameters,
      outputs: step.outputs,
      successCriteria: step.successCriteria,
      onSuccess: step.onSuccess,
      onFailure: step.onFailure,
    })),
    successActions: workflow.successActions,
    failureActions: workflow.failureActions,
  }));

  // Generate header markdown
  const headerMarkdown = formatHeaderAsMarkdown(metadata, { includeMetadata, includeDiagrams });

  // Generate per-workflow markdown
  const workflowMarkdowns = new Map<string, string>();
  workflows.forEach((wf) => {
    workflowMarkdowns.set(wf.workflowId, formatWorkflowAsMarkdown(metadata, wf));
  });

  // Full markdown (legacy)
  const markdown = formatAsMarkdown(metadata, workflows, { includeMetadata, includeDiagrams });

  return {
    metadata,
    workflows,
    markdown,
    headerMarkdown,
    workflowMarkdowns,
  };
}
