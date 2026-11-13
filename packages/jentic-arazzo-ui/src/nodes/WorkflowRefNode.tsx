import React from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { WorkflowRefNodeData, SuccessAction, FailureAction, Criterion } from '../types/index';
import { useArazzoViewer } from '../context/ArazzoViewerContext';

// Type guard for SuccessAction
const isSuccessAction = (action: unknown): action is SuccessAction => {
  return (
    action != null &&
    typeof action === 'object' &&
    'type' in action &&
    typeof (action as SuccessAction).type === 'string'
  );
};

// Type guard for FailureAction
const isFailureAction = (action: unknown): action is FailureAction => {
  return (
    action != null &&
    typeof action === 'object' &&
    'type' in action &&
    typeof (action as FailureAction).type === 'string'
  );
};

export const WorkflowRefNode: React.FC<NodeProps<WorkflowRefNodeData>> = ({ data, selected }) => {
  const { step, targetWorkflowId, isValid, workflowSuccessActions, workflowFailureActions } = data;
  const reactFlow = useReactFlow();
  const { nodes, setSelectedNode } = useArazzoViewer();

  // Handle clicking on an action that navigates to another step/workflow
  const handleActionClick = (action: SuccessAction | FailureAction, e: React.MouseEvent) => {
    e.stopPropagation();
    if (action.type === 'goto' && action.stepId) {
      const targetNode = nodes.find((n) => n.id === `step-${action.stepId}`);
      if (targetNode && targetNode.position) {
        setSelectedNode(`step-${action.stepId}`);
        reactFlow.setCenter(targetNode.position.x + 150, targetNode.position.y + 100, {
          zoom: reactFlow.getZoom(),
          duration: 300,
        });
      }
    }
  };

  // Selection styles - more prominent
  const borderColor = selected
    ? 'var(--arazzo-ring)'
    : isValid
      ? 'var(--arazzo-border)'
      : 'var(--arazzo-danger)';
  const boxShadow = selected
    ? '0 0 0 3px var(--arazzo-ring-glow), 0 8px 24px rgb(241 227 139 / 0.2)'
    : '0 2px 8px rgba(0,0,0,0.1)';

  return (
    <div
      className={`workflow-ref-node ${selected ? 'workflow-ref-node--selected' : ''} ${!isValid ? 'workflow-ref-node--invalid' : ''}`}
      style={{
        background: selected ? 'var(--arazzo-warning-bg)' : 'var(--arazzo-card)',
        border: `2px solid ${borderColor}`,
        borderRadius: '8px',
        width: '420px',
        boxShadow,
        transition: 'all 0.15s ease-in-out',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'var(--arazzo-border-hover)' }}
      />

      {/* Header */}
      <div
        style={{
          padding: '12px',
          borderBottom: `1px solid ${selected ? 'var(--arazzo-warning-border)' : 'var(--arazzo-border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: selected ? 'var(--arazzo-warning-bg)' : 'var(--arazzo-warning-bg)',
          borderRadius: '6px 6px 0 0',
          transition: 'all 0.15s ease-in-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={{ fontSize: '16px' }}>●</span>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--arazzo-fg)' }}>
            {step.stepId}
          </span>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'var(--arazzo-warning-bg)',
            color: 'var(--arazzo-warning)',
          }}
        >
          WORKFLOW
        </span>
      </div>

      {/* Workflow Reference */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--arazzo-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px' }}>🔄</span>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--arazzo-warning)' }}>
            ↳ {targetWorkflowId}
          </span>
        </div>
        {step.description && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--arazzo-muted-fg)',
              margin: '4px 0 0',
              lineHeight: '1.4',
            }}
          >
            {step.description}
          </p>
        )}
      </div>

      {/* Inputs */}
      {step.parameters && step.parameters.length > 0 && (
        <div style={{ padding: '12px', borderBottom: '1px solid var(--arazzo-border)' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--arazzo-muted-fg)',
              marginBottom: '6px',
            }}
          >
            INPUTS:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {step.parameters.slice(0, 3).map((param, idx) => {
              const isParameter = 'name' in param;
              if (!isParameter) return null;

              return (
                <div
                  key={idx}
                  style={{
                    fontSize: '11px',
                    color: 'var(--arazzo-fg-lighter)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>•</span>
                  <span style={{ fontWeight: 500 }}>{param.name}</span>
                  {typeof param.value === 'string' && param.value.startsWith('$') && (
                    <span style={{ color: 'var(--arazzo-accent-orange)', fontSize: '10px' }}>
                      ← {param.value}
                    </span>
                  )}
                </div>
              );
            })}
            {step.parameters.length > 3 && (
              <div
                style={{ fontSize: '10px', color: 'var(--arazzo-subtle-fg)', fontStyle: 'italic' }}
              >
                +{step.parameters.length - 3} more...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step-level onSuccess Actions */}
      {step.onSuccess && step.onSuccess.filter(isSuccessAction).length > 0 && (
        <div
          style={{
            padding: '12px',
            background: 'var(--arazzo-success-bg)',
            borderBottom: '1px solid var(--arazzo-success-border)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--arazzo-success)',
              marginBottom: '8px',
            }}
          >
            ON SUCCESS:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {step.onSuccess.filter(isSuccessAction).map((action, idx) => (
              <div
                key={action.name || idx}
                onClick={(e) => handleActionClick(action, e)}
                style={{
                  fontSize: '11px',
                  padding: '10px 12px',
                  background: 'var(--arazzo-card)',
                  borderRadius: '4px',
                  border: '1px solid var(--arazzo-success-border)',
                  position: 'relative',
                  cursor: action.type === 'goto' ? 'pointer' : 'default',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: action.criteria?.length ? '4px' : '0',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        action.type === 'end' ? 'var(--arazzo-danger)' : 'var(--arazzo-success)',
                    }}
                  >
                    {action.name || `action-${idx}`}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background:
                        action.type === 'end'
                          ? 'var(--arazzo-danger)'
                          : action.type === 'goto'
                            ? 'var(--arazzo-info-bg)'
                            : 'var(--arazzo-bg-secondary)',
                      color:
                        action.type === 'end'
                          ? 'var(--arazzo-on-accent)'
                          : action.type === 'goto'
                            ? 'var(--arazzo-info)'
                            : 'var(--arazzo-fg-lighter)',
                      fontWeight: action.type === 'end' ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    {action.type === 'end' && '■'}
                    {action.type}
                    {action.type === 'goto' && action.stepId && ` → ${action.stepId}`}
                  </span>
                </div>
                {action.criteria && action.criteria.length > 0 && (
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--arazzo-muted-fg)',
                      fontStyle: 'italic',
                    }}
                  >
                    {action.criteria.map((c: Criterion) => c.condition).join(' && ')}
                  </div>
                )}
                {action.type !== 'end' && (
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`success-${action.name || idx}`}
                    style={{
                      background: 'var(--arazzo-success)',
                      right: '-8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflow-level Success Actions (inherited) - only show if step has no overrides */}
      {workflowSuccessActions &&
        workflowSuccessActions.length > 0 &&
        (() => {
          // Map actions with their original indices, then filter
          // This preserves the actionIdx needed for handle IDs
          const inheritedActionsWithIdx: Array<{ action: SuccessAction; actionIdx: number }> =
            workflowSuccessActions
              .map((action, actionIdx) => ({ action, actionIdx }))
              .filter(({ action }) => isSuccessAction(action))
              .filter(({ action }) => {
                return !step.onSuccess?.some(
                  (stepAction) =>
                    'type' in stepAction &&
                    stepAction.name === (action as SuccessAction).name &&
                    stepAction.type === (action as SuccessAction).type,
                );
              }) as Array<{ action: SuccessAction; actionIdx: number }>;

          if (inheritedActionsWithIdx.length === 0) return null;

          return (
            <div
              style={{
                padding: '12px',
                background: 'var(--arazzo-success-bg)',
                borderBottom: '1px solid var(--arazzo-success-border)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--arazzo-success)',
                  marginBottom: '8px',
                }}
              >
                ON SUCCESS (INHERITED):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {inheritedActionsWithIdx.map(({ action, actionIdx }, idx) => {
                  return (
                    <div
                      key={action.name || idx}
                      onClick={(e) => action.type === 'goto' && handleActionClick(action, e)}
                      style={{
                        fontSize: '11px',
                        padding: '6px 8px',
                        background: 'var(--arazzo-card)',
                        borderRadius: '4px',
                        border: '1px solid var(--arazzo-success-border)',
                        position: 'relative',
                        cursor: action.type === 'goto' ? 'pointer' : 'default',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 600,
                            padding: '2px 4px',
                            borderRadius: '3px',
                            background: 'var(--arazzo-info-bg)',
                            color: 'var(--arazzo-info)',
                          }}
                        >
                          INHERITED
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--arazzo-success)' }}>
                          {action.name || `action-${idx}`}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background:
                              action.type === 'end'
                                ? 'var(--arazzo-danger)'
                                : 'var(--arazzo-info-bg)',
                            color:
                              action.type === 'end'
                                ? 'var(--arazzo-on-accent)'
                                : 'var(--arazzo-info)',
                            fontWeight: action.type === 'end' ? 600 : 400,
                          }}
                        >
                          {action.type === 'end' && '■ '}
                          {action.type}
                          {action.type === 'goto' && action.stepId && ` → ${action.stepId}`}
                        </span>
                      </div>
                      {action.criteria && action.criteria.length > 0 && (
                        <div
                          style={{
                            fontSize: '10px',
                            color: 'var(--arazzo-muted-fg)',
                            marginTop: '4px',
                          }}
                        >
                          {action.criteria.map((c: Criterion) => c.condition).join(' && ')}
                        </div>
                      )}
                      {action.type !== 'end' && (
                        <Handle
                          type="source"
                          position={Position.Right}
                          id={`workflow-success-${action.name || actionIdx}`}
                          style={{
                            background: 'var(--arazzo-success)',
                            right: '-8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      {/* Step-level onFailure Actions */}
      {step.onFailure && step.onFailure.filter(isFailureAction).length > 0 && (
        <div style={{ padding: '12px', background: 'var(--arazzo-danger-bg)' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--arazzo-danger)',
              marginBottom: '8px',
            }}
          >
            ON FAILURE:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {step.onFailure.filter(isFailureAction).map((action, idx) => (
              <div
                key={action.name || idx}
                onClick={(e) => handleActionClick(action, e)}
                style={{
                  fontSize: '11px',
                  padding: '10px 12px',
                  background: 'var(--arazzo-card)',
                  borderRadius: '4px',
                  border: '1px solid var(--arazzo-danger-border)',
                  position: 'relative',
                  cursor: action.type === 'goto' ? 'pointer' : 'default',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: action.criteria?.length ? '4px' : '0',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--arazzo-danger)' }}>
                    {action.name || `action-${idx}`}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background:
                        action.type === 'end'
                          ? 'var(--arazzo-danger)'
                          : action.type === 'goto'
                            ? 'var(--arazzo-info-bg)'
                            : action.type === 'retry'
                              ? 'var(--arazzo-warning-bg)'
                              : 'var(--arazzo-bg-secondary)',
                      color:
                        action.type === 'end'
                          ? 'var(--arazzo-on-accent)'
                          : action.type === 'goto'
                            ? 'var(--arazzo-info)'
                            : action.type === 'retry'
                              ? 'var(--arazzo-warning)'
                              : 'var(--arazzo-fg-lighter)',
                      fontWeight: action.type === 'end' ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    {action.type === 'end' && '■'}
                    {action.type}
                    {action.type === 'goto' && action.stepId && ` → ${action.stepId}`}
                    {action.type === 'retry' && action.retryLimit && ` (${action.retryLimit}x)`}
                  </span>
                </div>
                {action.criteria && action.criteria.length > 0 && (
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--arazzo-muted-fg)',
                      fontStyle: 'italic',
                    }}
                  >
                    {action.criteria.map((c: Criterion) => c.condition).join(' && ')}
                  </div>
                )}
                {action.type !== 'end' && (
                  <Handle
                    type="source"
                    position={Position.Left}
                    id={`failure-${action.name || idx}`}
                    style={{
                      background:
                        action.type === 'retry' ? 'var(--arazzo-warning)' : 'var(--arazzo-danger)',
                      left: '-8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflow-level Failure Actions (inherited) - only show if step has no overrides */}
      {workflowFailureActions &&
        workflowFailureActions.length > 0 &&
        (() => {
          // Map actions with their original indices, then filter
          // This preserves the actionIdx needed for handle IDs
          const inheritedActionsWithIdx: Array<{ action: FailureAction; actionIdx: number }> =
            workflowFailureActions
              .map((action, actionIdx) => ({ action, actionIdx }))
              .filter(({ action }) => isFailureAction(action))
              .filter(({ action }) => {
                return !step.onFailure?.some(
                  (stepAction) =>
                    'type' in stepAction &&
                    stepAction.name === (action as FailureAction).name &&
                    stepAction.type === (action as FailureAction).type,
                );
              }) as Array<{ action: FailureAction; actionIdx: number }>;

          if (inheritedActionsWithIdx.length === 0) return null;

          return (
            <div style={{ padding: '12px', background: 'var(--arazzo-danger-bg)' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--arazzo-danger)',
                  marginBottom: '8px',
                }}
              >
                ON FAILURE (INHERITED):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {inheritedActionsWithIdx.map(({ action, actionIdx }, idx) => {
                  return (
                    <div
                      key={action.name || idx}
                      onClick={(e) => action.type === 'goto' && handleActionClick(action, e)}
                      style={{
                        fontSize: '11px',
                        padding: '6px 8px',
                        background: 'var(--arazzo-card)',
                        borderRadius: '4px',
                        border: '1px solid var(--arazzo-danger-border)',
                        position: 'relative',
                        cursor: action.type === 'goto' ? 'pointer' : 'default',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 600,
                            padding: '2px 4px',
                            borderRadius: '3px',
                            background: 'var(--arazzo-info-bg)',
                            color: 'var(--arazzo-info)',
                          }}
                        >
                          INHERITED
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--arazzo-danger)' }}>
                          {action.name || `action-${idx}`}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background:
                              action.type === 'end'
                                ? 'var(--arazzo-danger)'
                                : action.type === 'goto'
                                  ? 'var(--arazzo-info-bg)'
                                  : 'var(--arazzo-warning-bg)',
                            color:
                              action.type === 'end'
                                ? 'var(--arazzo-on-accent)'
                                : action.type === 'goto'
                                  ? 'var(--arazzo-info)'
                                  : 'var(--arazzo-warning)',
                            fontWeight: action.type === 'end' ? 600 : 400,
                          }}
                        >
                          {action.type === 'end' && '■ '}
                          {action.type}
                          {action.type === 'goto' && action.stepId && ` → ${action.stepId}`}
                          {action.type === 'retry' &&
                            action.retryLimit &&
                            ` (${action.retryLimit}x)`}
                        </span>
                      </div>
                      {action.criteria && action.criteria.length > 0 && (
                        <div
                          style={{
                            fontSize: '10px',
                            color: 'var(--arazzo-muted-fg)',
                            marginTop: '4px',
                          }}
                        >
                          {action.criteria.map((c: Criterion) => c.condition).join(' && ')}
                        </div>
                      )}
                      {action.type !== 'end' && (
                        <Handle
                          type="source"
                          position={Position.Left}
                          id={`workflow-failure-${action.name || actionIdx}`}
                          style={{
                            background: 'var(--arazzo-danger)',
                            left: '-8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      <Handle
        type="source"
        position={Position.Bottom}
        id="sequential"
        style={{ background: 'var(--arazzo-border-hover)' }}
      />
    </div>
  );
};
