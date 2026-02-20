import { Workflow, ArazzoDocument } from '../../types/arazzo';

/**
 * Generates Mermaid sequence diagram showing client-API interactions
 */
export function generateMermaidSequence(workflow: Workflow, document: ArazzoDocument): string {
  const lines: string[] = ['sequenceDiagram'];
  lines.push('    participant Client');

  // Add API participants from sourceDescriptions
  const sources = document.sourceDescriptions || [];
  const apiParticipants = new Map<string, string>();

  // Create participant names from source descriptions
  sources.forEach((source) => {
    const participantName = source.name.replace(/[^a-zA-Z0-9]/g, '');
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
    if (step.operationId || step.operationPath) {
      const operation = step.operationId || step.operationPath || 'operation';

      // Determine target API by parsing operationId
      // Supports two formats:
      // 1. Runtime expression: $sourceDescriptions.{sourceName}.{operationName}
      // 2. Direct reference: {sourceName}.{operationName}
      let target = defaultApi;
      let sourceName: string | undefined;

      if (typeof operation === 'string') {
        if (operation.startsWith('$sourceDescriptions.')) {
          // Runtime expression format
          const parts = operation.split('.');
          if (parts.length >= 3) {
            sourceName = parts[1];
          }
        } else if (operation.includes('.')) {
          // Direct reference format - check if first part matches a source name
          const parts = operation.split('.');
          const potentialSource = parts[0];
          if (apiParticipants.has(potentialSource)) {
            sourceName = potentialSource;
          }
        }

        // Map source name to participant
        if (sourceName) {
          target = apiParticipants.get(sourceName) || defaultApi;
        } else if (sources.length > 0) {
          // Fallback to first source if no match found
          target = apiParticipants.get(sources[0].name) || defaultApi;
        }
      }

      // Extract clean operation name for display
      let displayOperation = operation;
      if (typeof operation === 'string') {
        if (operation.startsWith('$sourceDescriptions.')) {
          // Runtime expression: extract from third part onwards
          displayOperation = operation.split('.').slice(2).join('.');
        } else if (sourceName && operation.includes('.')) {
          // Direct reference: extract from second part onwards
          displayOperation = operation.split('.').slice(1).join('.');
        }
      }
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
