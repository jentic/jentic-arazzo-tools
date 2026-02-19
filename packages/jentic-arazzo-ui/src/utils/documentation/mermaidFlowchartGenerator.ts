import { Workflow } from '../../types/arazzo';

/**
 * Generates Mermaid flowchart diagram showing workflow control flow
 */
export function generateMermaidFlowchart(workflow: Workflow): string {
  const lines: string[] = ['flowchart TD'];

  // Start node
  lines.push('    Start([Start]) --> Step1');

  workflow.steps.forEach((step, idx) => {
    const stepNum = idx + 1;
    const nextStepNum = stepNum + 1;
    const stepId = `Step${stepNum}`;
    const operation = step.operationId || step.operationPath || step.workflowId || step.stepId;

    // Truncate long operation names
    const displayOperation = operation.length > 30 ? operation.substring(0, 27) + '...' : operation;

    // Step node
    lines.push(`    ${stepId}["${stepNum}. ${displayOperation}"]`);

    // Add description as note if present
    if (step.description) {
      const shortDesc =
        step.description.length > 40 ? step.description.substring(0, 37) + '...' : step.description;
      lines.push(`    ${stepId} -.-> Note${stepNum}[/"${shortDesc}"/]`);
      lines.push(`    style Note${stepNum} fill:#f0f9ff,stroke:#3b82f6,stroke-width:1px`);
    }

    // Handle success criteria and branching
    const hasSuccessCriteria = step.successCriteria && step.successCriteria.length > 0;
    const hasFailureActions = step.onFailure && step.onFailure.length > 0;

    if (hasSuccessCriteria || hasFailureActions) {
      const decisionId = `Decision${stepNum}`;
      const condition = hasSuccessCriteria ? step.successCriteria![0].condition : 'Success?';

      const shortCondition = condition.length > 30 ? condition.substring(0, 27) + '...' : condition;

      lines.push(`    ${stepId} --> ${decisionId}{"${shortCondition}"}`);

      // Success path
      if (step.onSuccess && step.onSuccess.length > 0) {
        const action = step.onSuccess[0];
        if ('type' in action) {
          if (action.type === 'goto' && action.stepId) {
            // Find target step index
            const targetIdx = workflow.steps.findIndex((s) => s.stepId === action.stepId);
            if (targetIdx !== -1) {
              lines.push(`    ${decisionId} -->|Yes| Step${targetIdx + 1}`);
            } else {
              lines.push(`    ${decisionId} -->|Yes| End`);
            }
          } else if (action.type === 'goto' && action.workflowId) {
            lines.push(
              `    ${decisionId} -->|Yes| CallWorkflow${stepNum}["Call: ${action.workflowId}"]`,
            );
            lines.push(`    CallWorkflow${stepNum} --> Step${nextStepNum}`);
          } else if (action.type === 'end') {
            lines.push(`    ${decisionId} -->|Yes| End`);
          } else {
            // Default: continue to next step
            if (stepNum < workflow.steps.length) {
              lines.push(`    ${decisionId} -->|Yes| Step${nextStepNum}`);
            } else {
              lines.push(`    ${decisionId} -->|Yes| End`);
            }
          }
        }
      } else {
        // No explicit success action, continue to next step
        if (stepNum < workflow.steps.length) {
          lines.push(`    ${decisionId} -->|Yes| Step${nextStepNum}`);
        } else {
          lines.push(`    ${decisionId} -->|Yes| End`);
        }
      }

      // Failure path
      if (hasFailureActions) {
        const action = step.onFailure![0];
        if ('type' in action) {
          if (action.type === 'retry') {
            const retryLimit = action.retryLimit ? `${action.retryLimit}x` : '∞';
            const retryDelay = action.retryAfter ? ` (${action.retryAfter}s)` : '';
            lines.push(
              `    ${decisionId} -->|No| Retry${stepNum}["Retry ${retryLimit}${retryDelay}"]`,
            );
            lines.push(`    Retry${stepNum} --> ${stepId}`);
            lines.push(`    style Retry${stepNum} fill:#fef3c7,stroke:#f59e0b,stroke-width:2px`);
          } else if (action.type === 'goto' && action.stepId) {
            const targetIdx = workflow.steps.findIndex((s) => s.stepId === action.stepId);
            if (targetIdx !== -1) {
              lines.push(`    ${decisionId} -->|No| Step${targetIdx + 1}`);
            } else {
              lines.push(`    ${decisionId} -->|No| Error${stepNum}["Error"]`);
              lines.push(`    Error${stepNum} --> End`);
              lines.push(`    style Error${stepNum} fill:#fee2e2,stroke:#dc2626,stroke-width:2px`);
            }
          } else if (action.type === 'goto' && action.workflowId) {
            lines.push(
              `    ${decisionId} -->|No| CallWorkflowFail${stepNum}["Call: ${action.workflowId}"]`,
            );
            if (stepNum < workflow.steps.length) {
              lines.push(`    CallWorkflowFail${stepNum} --> Step${nextStepNum}`);
            } else {
              lines.push(`    CallWorkflowFail${stepNum} --> End`);
            }
          } else if (action.type === 'end') {
            lines.push(`    ${decisionId} -->|No| Error${stepNum}["Workflow Failed"]`);
            lines.push(`    Error${stepNum} --> End`);
            lines.push(`    style Error${stepNum} fill:#fee2e2,stroke:#dc2626,stroke-width:2px`);
          }
        }
      } else {
        // No failure action, end with error
        lines.push(`    ${decisionId} -->|No| Error${stepNum}["Error"]`);
        lines.push(`    Error${stepNum} --> End`);
        lines.push(`    style Error${stepNum} fill:#fee2e2,stroke:#dc2626,stroke-width:2px`);
      }
    } else {
      // No branching, just continue to next step
      if (stepNum < workflow.steps.length) {
        lines.push(`    ${stepId} --> Step${nextStepNum}`);
      } else {
        lines.push(`    ${stepId} --> End`);
      }
    }

    // Style the step node
    lines.push(`    style ${stepId} fill:#dbeafe,stroke:#3b82f6,stroke-width:2px`);
  });

  // End node
  lines.push('    End([End])');
  lines.push('    style End fill:#d1fae5,stroke:#10b981,stroke-width:2px');
  lines.push('    style Start fill:#e0e7ff,stroke:#6366f1,stroke-width:2px');

  return lines.join('\n');
}
