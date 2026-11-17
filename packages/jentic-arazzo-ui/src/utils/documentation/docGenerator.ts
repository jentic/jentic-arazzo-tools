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
  // per workflow, by index in `workflows`: ids can be missing or repeated in invalid documents
  workflowMarkdowns: string[];
  // why the header or a workflow (by index) couldn't be generated, shown in place of its markdown
  headerError?: string;
  workflowErrors: (string | undefined)[];
  // validation notes shown inline in each workflow, by index in `workflows`
  workflowNotes: DocumentDiagnostic[][];
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

  // each part is generated on its own, so an invalid part of the document only replaces that
  // part with a notice instead of failing the whole docs view
  const header = generateSafely(() =>
    formatHeaderAsMarkdown(metadata, { includeMetadata, includeDiagrams }),
  );

  // Generate per-workflow markdown
  const workflowMarkdowns: string[] = [];
  const workflowNotes: DocumentDiagnostic[][] = [];
  const workflowErrors: (string | undefined)[] = [];
  workflows.forEach((wf, workflowIndex) => {
    let notes: DocumentDiagnostic[] = [];
    const { markdown, error } = generateSafely(() => {
      const formatted = formatWorkflowWithNotes(metadata, wf, { workflowIndex, diagnostics });
      notes = formatted.notes;
      return formatted.markdown;
    });
    workflowMarkdowns.push(markdown);
    workflowNotes.push(notes);
    workflowErrors.push(error);
  });

  // Full markdown (legacy)
  const { markdown } = generateSafely(() =>
    formatAsMarkdown(metadata, workflows, { includeMetadata, includeDiagrams }),
  );

  return {
    metadata,
    workflows,
    markdown,
    headerMarkdown: header.markdown,
    headerError: header.error,
    workflowMarkdowns,
    workflowErrors,
    workflowNotes,
  };
}

/**
 * Runs a markdown generator, returning the error instead when an invalid document makes it throw;
 * the docs view shows a notice in its place.
 */
function generateSafely(generate: () => string): { markdown: string; error?: string } {
  try {
    return { markdown: generate() };
  } catch (error) {
    return { markdown: '', error: error instanceof Error ? error.message : String(error) };
  }
}
