import { ArazzoDocument } from '../../types/arazzo';
import { DocumentationMetadata, ViewerStep, WorkflowDocumentation } from '../../types/viewer';
import { generateMetadata } from './metadataGenerator';
import type { DocumentDiagnostic } from '../validation';
import {
  formatAsMarkdown,
  formatHeaderAsMarkdown,
  formatWorkflowWithNotes,
} from './markdownFormatter';

export interface GenerateDocumentationOptions {
  includeMetadata?: boolean;
  includeDiagrams?: boolean;
  documentURL?: string | null;
  // validator diagnostics with resolved document paths, shown inline next to the elements
  diagnostics?: DocumentDiagnostic[];
}

export interface DocumentationOutput {
  metadata: DocumentationMetadata;
  workflows: WorkflowDocumentation[];
  markdown: string;
  headerMarkdown: string;
  workflowMarkdowns: Map<string, string>;
  // validation notes shown inline in each workflow, keyed by workflowId
  workflowNotes: Map<string, DocumentDiagnostic[]>;
}

/**
 * Generates complete documentation from an Arazzo document
 */
export function generateDocumentation(
  document: ArazzoDocument,
  options: GenerateDocumentationOptions = {},
): DocumentationOutput {
  const { includeMetadata = true, includeDiagrams = false, documentURL, diagnostics } = options;

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
      operation: (step as ViewerStep)._operation,
      workflowId: step.workflowId,
      parameters: step.parameters,
      requestBody: step.requestBody,
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
  const workflowNotes = new Map<string, DocumentDiagnostic[]>();
  workflows.forEach((wf, workflowIndex) => {
    const formatted = formatWorkflowWithNotes(metadata, wf, { workflowIndex, diagnostics });
    workflowMarkdowns.set(wf.workflowId, formatted.markdown);
    workflowNotes.set(wf.workflowId, formatted.notes);
  });

  // Full markdown (legacy)
  const markdown = formatAsMarkdown(metadata, workflows, { includeMetadata, includeDiagrams });

  return {
    metadata,
    workflows,
    markdown,
    headerMarkdown,
    workflowMarkdowns,
    workflowNotes,
  };
}
