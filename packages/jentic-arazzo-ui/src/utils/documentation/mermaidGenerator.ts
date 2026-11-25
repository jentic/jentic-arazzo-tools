import { Workflow, ArazzoDocument } from '../../types/arazzo';
import { ViewerStep } from '../../types/viewer';
import { describeStepOperation } from '../stepOperationLabel';
import { escapeMermaidText } from './escapeMermaidText';

/**
 * Generates Mermaid sequence diagram showing client-API interactions
 */
export function generateMermaidSequence(workflow: Workflow, document: ArazzoDocument): string {
  const lines: string[] = ['sequenceDiagram'];
  lines.push('    participant Client');

  // Add API participants from sourceDescriptions; invalid documents can have sources without a
  // string name (reported by validation), which no step can reference, so they are left out
  const sources = (document.sourceDescriptions || []).filter(
    (source) => typeof source?.name === 'string' && source.name !== '',
  );
  const apiParticipants = new Map<string, string>();

  // Create participant names from source descriptions
  sources.forEach((source, index) => {
    // names made only of symbols would otherwise produce an empty mermaid identifier
    const participantName = source.name.replace(/[^a-zA-Z0-9]/g, '') || `Source${index + 1}`;
    apiParticipants.set(source.name, participantName);
    lines.push(`    participant ${participantName} as ${source.name}`);
  });

  // Default API if no sources
  const defaultApi = 'API';
  if (sources.length === 0) {
    lines.push(`    participant ${defaultApi}`);
  }

  // Add workflow start note
  if (workflow.inputs && typeof workflow.inputs === 'object' && 'properties' in workflow.inputs) {
    const properties = workflow.inputs.properties as Record<string, any>;
    const inputKeys = Object.keys(properties || {});
    if (inputKeys.length > 0) {
      lines.push(
        `    Note over Client: ${inputKeys.length} input${inputKeys.length > 1 ? 's' : ''}`,
      );
    }
  }

  // Generate sequence for each step
  workflow.steps.forEach((step, idx) => {
    const op = describeStepOperation(step, {
      operation: (step as ViewerStep)._operation,
      sourceNames: apiParticipants.keys(),
    });
    if (op) {
      // target the API the step names, falling back to the first source
      let target = defaultApi;
      if (op.sourceName && apiParticipants.has(op.sourceName)) {
        target = apiParticipants.get(op.sourceName)!;
      } else if (sources.length > 0) {
        target = apiParticipants.get(sources[0].name) || defaultApi;
      }

      const displayOperation = escapeMermaidText(op.label);
      const stepLabel = `${idx + 1}. ${displayOperation}`;

      // Show parameters as note if present
      if (step.parameters && step.parameters.length > 0) {
        const paramCount = step.parameters.length;
        lines.push(`    Note right of Client: ${paramCount} parameter${paramCount > 1 ? 's' : ''}`);
      }

      lines.push(`    Client->>+${target}: ${stepLabel}`);

      // Show success criteria if present
      if (step.successCriteria && step.successCriteria.length > 0) {
        const condition = step.successCriteria[0].condition;
        // Shorten condition for readability
        const shortCondition =
          condition.length > 40 ? condition.substring(0, 37) + '...' : condition;
        lines.push(`    Note right of ${target}: ✓ ${shortCondition}`);
      }

      lines.push(`    ${target}-->>-Client: Response`);

      // Show outputs if present
      if (step.outputs && Object.keys(step.outputs).length > 0) {
        const count = Object.keys(step.outputs).length;
        lines.push(`    Note over Client: Store ${count} output${count > 1 ? 's' : ''}`);
      }

      // Show failure actions if present
      if (step.onFailure && step.onFailure.length > 0) {
        step.onFailure.forEach((action) => {
          if ('type' in action && action.type === 'retry') {
            const retryLimit = action.retryLimit || '∞';
            lines.push(`    Note over Client: On failure: Retry ${retryLimit}x`);
          }
        });
      }
    } else if (step.workflowId) {
      // Workflow call
      lines.push(`    Client->>Client: Call workflow ${step.workflowId}`);
    }
  });

  // Add workflow end note
  if (workflow.outputs && Object.keys(workflow.outputs).length > 0) {
    const count = Object.keys(workflow.outputs).length;
    lines.push(`    Note over Client: Returns ${count} output${count > 1 ? 's' : ''}`);
  }

  return lines.join('\n');
}
