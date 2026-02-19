import { DocumentationMetadata, WorkflowDocumentation } from '../../types/viewer';

export interface FormatOptions {
  includeMetadata?: boolean;
  includeDiagrams?: boolean;
}

/**
 * Formats documentation data as markdown string
 */
function sourceIcon(type: string): string {
  const color = type === 'openapi' ? '#49cc90' : '#61affe';
  return `<svg class="source-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="12" height="12" rx="3" fill="${color}" opacity="0.15" stroke="${color}" stroke-width="1"/><circle cx="7" cy="7" r="2" fill="${color}"/></svg>`;
}

/**
 * Formats the document header (title, version, summary, sources) as markdown.
 */
export function formatHeaderAsMarkdown(
  metadata: DocumentationMetadata,
  options: FormatOptions = {},
): string {
  const { includeMetadata = true } = options;
  const sections: string[] = [];

  // Document header with title and inline version pills
  sections.push(
    `<div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: ${metadata.documentURL ? '8px' : '20px'}; flex-wrap: wrap;">`,
  );
  sections.push(
    `<h1 style="margin: 0; font-size: 2.25rem; font-weight: 700; color: #111827; line-height: 1;">${metadata.title}</h1>`,
  );
  sections.push(
    `<span class="version-badge spec-version" title="Document version">${metadata.version}</span>`,
  );
  sections.push(
    `<span class="version-badge doc-version" title="Arazzo Specification version">Arazzo ${metadata.arazzoVersion || '1.0.1'}</span>`,
  );
  sections.push(`</div>\n`);

  if (metadata.documentURL) {
    sections.push(
      `<div style="margin-bottom: 20px;"><a href="${metadata.documentURL}" target="_blank" rel="noopener noreferrer" style="font-size: 0.75rem; word-break: break-all;">${metadata.documentURL}</a></div>\n`,
    );
  }

  if (metadata.summary) {
    sections.push(`\n${metadata.summary}\n`);
  }

  if (metadata.description) {
    sections.push(`\n${metadata.description}\n`);
  }

  // Metadata section - source cards
  if (includeMetadata && metadata.sourceDescriptions.length > 0) {
    sections.push('\n<div class="sources-section">\n');
    sections.push(`<div class="sources-header">Source Descriptions</div>`);
    sections.push(`<div class="sources-grid">`);
    metadata.sourceDescriptions.forEach((sd) => {
      const typeLabel = (sd.type || 'api').toUpperCase();
      const typeClass = sd.type === 'openapi' ? 'source-type-openapi' : 'source-type-arazzo';
      sections.push(`<div class="source-card">`);
      sections.push(`<div class="source-card-top">`);
      sections.push(`${sourceIcon(sd.type || 'arazzo')}`);
      sections.push(`<span class="source-type-badge ${typeClass}">${typeLabel}</span>`);
      sections.push(`<span class="source-name">${sd.name}</span>`);
      sections.push(`</div>`);
      sections.push(
        `<a class="source-url" href="${sd.url}" target="_blank" rel="noopener noreferrer">${sd.url}</a>`,
      );
      sections.push(`</div>`);
    });
    sections.push(`</div>`);
    sections.push('\n</div>\n');
  }

  return sections.join('\n');
}

/**
 * Formats a single workflow's inner content (description, inputs, steps, outputs) as markdown.
 */
export function formatWorkflowAsMarkdown(
  metadata: DocumentationMetadata,
  workflow: WorkflowDocumentation,
): string {
  const sections: string[] = [];

  // build source name → type lookup
  const sourceTypes = new Map<string, string>();
  metadata.sourceDescriptions.forEach((sd) => {
    sourceTypes.set(sd.name, sd.type || 'arazzo');
  });

  if (workflow.description) {
    sections.push(`<div class="workflow-description">${workflow.description}</div>\n`);
  }

  // Inputs - parse JSONSchema
  if (workflow.inputs && typeof workflow.inputs === 'object') {
    const properties =
      'properties' in workflow.inputs ? (workflow.inputs.properties as Record<string, any>) : null;

    if (properties && Object.keys(properties).length > 0) {
      sections.push('\n<div class="doc-section">\n');
      sections.push('\n### ↓ Inputs\n');
      sections.push(
        '\nBefore starting this workflow, you need to provide the following inputs:\n\n',
      );
      sections.push('| Parameter | Type | Description |');
      sections.push('|-----------|------|-------------|');

      const required =
        'required' in workflow.inputs && Array.isArray(workflow.inputs.required)
          ? workflow.inputs.required
          : [];

      Object.entries(properties).forEach(([key, schema]) => {
        const typeStr =
          typeof schema === 'object' && schema !== null && 'type' in schema
            ? String(schema.type)
            : 'any';
        const desc =
          typeof schema === 'object' && schema !== null && 'description' in schema
            ? String(schema.description)
            : '';
        const reqLabel = required.includes(key) ? '**REQUIRED.** ' : '';
        sections.push(`| \`${key}\` | ${typeStr} | ${reqLabel}${desc || 'N/A'} |`);
      });
      sections.push('\n</div>\n');
    }
  }

  // Steps as timeline
  sections.push(`\n<div class="timeline">\n`);
  workflow.steps.forEach((step, idx) => {
    const isLast = idx === workflow.steps.length - 1;
    sections.push(`<div class="timeline-item${isLast ? ' timeline-item-last' : ''}">`);
    sections.push(
      `<div class="timeline-marker"><div class="timeline-dot">${idx + 1}</div><div class="timeline-line"></div></div>`,
    );
    sections.push(`<div class="timeline-content">`);
    sections.push(`<div class="step-card">`);

    // Step header
    sections.push(`<div class="timeline-step-header">`);
    sections.push(`<span class="timeline-step-name">${step.stepId}</span>`);
    sections.push(`</div>`);

    // Description + operation combined
    let opHtml = '';
    if (step.operationId) {
      const dotIdx = step.operationId.indexOf('.');
      if (dotIdx > 0) {
        const source = step.operationId.substring(0, dotIdx);
        const operation = step.operationId.substring(dotIdx + 1);
        const type = sourceTypes.get(source) || 'arazzo';
        opHtml = `<span class="timeline-operation-group">${sourceIcon(type)}<span class="timeline-source">${source}</span><span class="timeline-op-name">${operation}</span></span>`;
      } else {
        const defaultType =
          metadata.sourceDescriptions.length > 0
            ? metadata.sourceDescriptions[0].type || 'arazzo'
            : 'arazzo';
        const color = defaultType === 'openapi' ? '#49cc90' : '#61affe';
        opHtml = `<span class="step-op-ref" style="color: ${color}">${step.operationId}</span>`;
      }
    } else if (step.operationPath) {
      opHtml = `<code>${step.operationPath}</code>`;
    } else if (step.workflowId) {
      opHtml = `<code>${step.workflowId}</code>`;
    }

    if (step.description && opHtml) {
      sections.push(
        `<div class="step-description">${step.description} via ${opHtml} Operation</div>`,
      );
    } else if (step.description) {
      sections.push(`<div class="step-description">${step.description}</div>`);
    } else if (opHtml) {
      sections.push(`<div class="step-description">via ${opHtml} Operation</div>`);
    }

    // Parameters
    if (step.parameters && step.parameters.length > 0) {
      sections.push(
        `<details class="step-detail"><summary class="step-detail-summary">Parameters <span class="step-detail-count">${step.parameters.length}</span></summary>`,
      );
      sections.push(`<div class="step-detail-body step-grid-3">`);
      step.parameters.forEach((param) => {
        if ('$ref' in param) {
          sections.push(`<div class="step-row">Reference: <code>${param.$ref}</code></div>`);
        } else if ('name' in param && 'in' in param) {
          const value = typeof param.value === 'string' ? param.value : JSON.stringify(param.value);
          const arrow = typeof value === 'string' && value.startsWith('$') ? '←' : '=';
          sections.push(
            `<div class="step-grid-row"><span><code>${param.name}</code> <span class="step-in">${param.in}</span></span><span class="step-arrow">${arrow}</span><span><code>${value}</code></span></div>`,
          );
        }
      });
      sections.push(`</div></details>`);
    }

    // Success criteria
    if (step.successCriteria && step.successCriteria.length > 0) {
      sections.push(
        `<details class="step-detail"><summary class="step-detail-summary">Success Criteria <span class="step-detail-count">${step.successCriteria.length}</span></summary>`,
      );
      sections.push(`<div class="step-detail-body">`);
      step.successCriteria.forEach((c) => {
        sections.push(`<div class="step-row"><code>${c.condition}</code></div>`);
      });
      sections.push(`</div></details>`);
    }

    // Outputs
    if (step.outputs && Object.keys(step.outputs).length > 0) {
      const outputCount = Object.keys(step.outputs).length;
      sections.push(
        `<details class="step-detail"><summary class="step-detail-summary">Outputs <span class="step-detail-count">${outputCount}</span></summary>`,
      );
      sections.push(`<div class="step-detail-body step-grid-3">`);
      Object.entries(step.outputs).forEach(([key, value]) => {
        sections.push(
          `<div class="step-grid-row"><span><code>${key}</code></span><span class="step-arrow">←</span><span><code>${value}</code></span></div>`,
        );
      });
      sections.push(`</div></details>`);
    }

    // Actions (combined success + failure)
    const allSuccessActions = [...(step.onSuccess || []), ...(workflow.successActions || [])];
    const allFailureActions = [...(step.onFailure || []), ...(workflow.failureActions || [])];
    if (allSuccessActions.length > 0 || allFailureActions.length > 0) {
      const actionCount = allSuccessActions.length + allFailureActions.length;
      sections.push(
        `<details class="step-detail"><summary class="step-detail-summary">Actions <span class="step-detail-count">${actionCount}</span></summary>`,
      );
      sections.push(`<div class="step-detail-body step-grid-3">`);
      allSuccessActions.forEach((action) => {
        if ('$ref' in action) {
          sections.push(
            `<div class="step-grid-row"><span><code>${action.$ref}</code></span><span></span><span></span></div>`,
          );
        } else if ('type' in action) {
          const an = action.name ? `<strong>${action.name}</strong>` : '';
          if (action.type === 'goto') {
            const target = action.stepId || action.workflowId || 'end';
            sections.push(
              `<div class="step-grid-row"><span>${an}</span><span class="step-arrow">→</span><span>Continue to <code>${target}</code> <span class="badge badge-success">GOTO</span></span></div>`,
            );
          } else if (action.type === 'end') {
            sections.push(
              `<div class="step-grid-row"><span>${an}</span><span class="step-arrow">→</span><span>Workflow completes <span class="badge badge-success">END</span></span></div>`,
            );
          }
        }
      });
      allFailureActions.forEach((action) => {
        if ('$ref' in action) {
          sections.push(
            `<div class="step-grid-row"><span><code>${action.$ref}</code></span><span></span><span></span></div>`,
          );
        } else if ('type' in action) {
          const an = action.name ? `<strong>${action.name}</strong>` : '';
          if (action.type === 'goto') {
            const target = action.stepId || action.workflowId || 'end';
            sections.push(
              `<div class="step-grid-row"><span>${an}</span><span class="step-arrow">→</span><span>Jump to <code>${target}</code> <span class="badge badge-error">GOTO</span></span></div>`,
            );
          } else if (action.type === 'retry') {
            const limit = action.retryLimit ? `${action.retryLimit} times` : 'unlimited';
            const delay = action.retryAfter ? ` (wait ${action.retryAfter}s)` : '';
            sections.push(
              `<div class="step-grid-row"><span>${an}</span><span class="step-arrow">→</span><span>Retry ${limit}${delay} <span class="badge badge-warning">RETRY</span></span></div>`,
            );
          } else if (action.type === 'end') {
            sections.push(
              `<div class="step-grid-row"><span>${an}</span><span class="step-arrow">→</span><span>Workflow terminates <span class="badge badge-error">END</span></span></div>`,
            );
          }
        }
      });
      sections.push(`</div></details>`);
    }

    sections.push(`</div>`); // close step-card
    sections.push(`</div>`); // close timeline-content
    sections.push(`</div>\n`); // close timeline-item
  });
  sections.push(`</div>\n`); // close timeline

  // Outputs
  if (workflow.outputs && Object.keys(workflow.outputs).length > 0) {
    sections.push('\n<div class="doc-section">\n');
    sections.push('\n### ↓ Outputs\n');
    sections.push('\nWhen this workflow completes successfully, it returns:\n\n');
    sections.push('| Output | Source |');
    sections.push('|--------|--------|');
    Object.entries(workflow.outputs).forEach(([key, value]) => {
      sections.push(`| **\`${key}\`** | \`${value}\` |`);
    });
    sections.push('\n</div>\n');
  }

  return sections.join('\n');
}

/**
 * Formats the full document as a single markdown string (legacy).
 */
export function formatAsMarkdown(
  metadata: DocumentationMetadata,
  workflows: WorkflowDocumentation[],
  options: FormatOptions = {},
): string {
  const sections: string[] = [];

  sections.push(formatHeaderAsMarkdown(metadata, options));

  sections.push(
    `<div class="workflows-header-row"><span class="sources-header" style="margin: 0;">Workflows</span><button class="expand-all-btn">Expand All</button></div>`,
  );
  workflows.forEach((workflow) => {
    const stepCount = workflow.steps.length;
    sections.push(`\n<details class="workflow-details">\n`);
    sections.push(`<summary class="workflow-summary-bar">`);
    sections.push(
      `<span class="step-count-badge">${stepCount} ${stepCount === 1 ? 'Step' : 'Steps'}</span>`,
    );
    sections.push(`<span class="workflow-summary-title">${workflow.workflowId}</span>`);
    if (workflow.summary) {
      sections.push(`<span class="workflow-summary-text">${workflow.summary}</span>`);
    }
    sections.push(`</summary>\n`);
    sections.push(`<div class="workflow-details-content">\n`);
    sections.push(formatWorkflowAsMarkdown(metadata, workflow));
    sections.push(`\n</div>\n`);
    sections.push(`\n</details>\n`);
  });

  return sections.join('\n');
}
