import React, { useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { StepNodeData, SuccessAction, FailureAction, Criterion } from '../types/index';
import { useArazzoViewer } from '../context/ArazzoViewerContext';
import { RequestBodyDialog } from '../components/RequestBodyDialog';
import { getRequestBodyView } from '../utils/documentation/requestBodyView';
import { renderMethodBadgeStyle } from '../utils/operationMethods';
import { arazzoLogoSvg } from '../utils/arazzoLogo';

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

export const StepNode: React.FC<NodeProps<StepNodeData>> = ({ data, selected }) => {
  const { step, isValid, workflowId, workflowSuccessActions, workflowFailureActions } = data;
  const reactFlow = useReactFlow();
  const { nodes, setSelectedNode } = useArazzoViewer();
  const [showRequestBody, setShowRequestBody] = useState(false);

  // Navigate to target node when clicking on a goto action
  const handleActionClick = (action: SuccessAction | FailureAction, e: React.MouseEvent) => {
    e.stopPropagation();
    if (action.type === 'goto' && action.stepId) {
      // Construct the full node ID (workflowId-stepId)
      const targetNodeId = `${workflowId}-${action.stepId}`;
      const targetNode = nodes.find((n) => n.id === targetNodeId);
      if (targetNode && targetNode.position) {
        setSelectedNode(targetNodeId);
        reactFlow.setCenter(targetNode.position.x + 150, targetNode.position.y + 100, {
          zoom: reactFlow.getZoom(),
          duration: 300,
        });
      }
    }
  };

  const getOperationType = () => {
    if (step.operationId) return 'API';
    if (step.operationPath) return 'API';
    if (step.workflowId) return 'WORKFLOW';
    return 'UNKNOWN';
  };

  const getOperationDisplay = () => {
    if (step.operationId) return step.operationId;
    if (step.operationPath) return step.operationPath.split('/').pop() || 'operation';
    if (step.workflowId) return step.workflowId;
    return 'No operation';
  };

  const operationType = getOperationType();
  const requestBody = getRequestBodyView(step.requestBody);
  const httpMethod = step._operation?.method;
  const hasInputs = step.parameters && step.parameters.length > 0;
  const hasOutputs = step.outputs && Object.keys(step.outputs).length > 0;
  const hasSuccessCriteria = step.successCriteria && step.successCriteria.length > 0;

  // Selection styles - more prominent
  const borderColor = selected
    ? 'var(--arazzo-ring)'
    : isValid
      ? 'var(--arazzo-border)'
      : 'var(--arazzo-danger)';
  const boxShadow = selected
    ? '0 0 0 3px var(--arazzo-ring-glow), 0 8px 24px var(--arazzo-ring-glow)'
    : '0 2px 8px rgba(0,0,0,0.1)';

  return (
    <>
      <div
        className={`step-node ${selected ? 'step-node--selected' : ''} ${!isValid ? 'step-node--invalid' : ''}`}
        style={{
          background: selected ? 'var(--arazzo-card-selected)' : 'var(--arazzo-card)',
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
            borderBottom: `1px solid ${selected ? 'var(--arazzo-info-border)' : 'var(--arazzo-border)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: selected ? 'var(--arazzo-info-bg)' : 'var(--arazzo-bg-secondary)',
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
              background:
                operationType === 'API' ? 'var(--arazzo-info-bg)' : 'var(--arazzo-warning-bg)',
              color: operationType === 'API' ? 'var(--arazzo-info)' : 'var(--arazzo-warning)',
            }}
          >
            {operationType}
          </span>
        </div>

        {/* Operation */}
        <div style={{ padding: '12px', borderBottom: '1px solid var(--arazzo-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px' }}>🔗</span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--arazzo-primary)' }}>
              {getOperationDisplay()}
            </span>
            {httpMethod && (
              <span
                className={`http-method http-method--${httpMethod.toLowerCase()}`}
                title={step._operation?.path}
                style={renderMethodBadgeStyle(httpMethod)}
              >
                {httpMethod}
              </span>
            )}
            {step.workflowId && (
              <span
                className="workflow-badge"
                title="Workflow"
                style={{ marginLeft: 'auto', display: 'inline-flex' }}
                dangerouslySetInnerHTML={{ __html: arazzoLogoSvg('width: 16px; height: 16px;') }}
              />
            )}
          </div>
          {step.description && (
            <p
              style={{
                fontSize: '12px',
                color: 'var(--arazzo-muted-fg)',
                margin: '4px 0 0',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 5,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {step.description}
            </p>
          )}
        </div>

        {/* Inputs */}
        {hasInputs && (
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
              {step.parameters?.slice(0, 3).map((param, idx) => {
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
              {step.parameters && step.parameters.length > 3 && (
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--arazzo-subtle-fg)',
                    fontStyle: 'italic',
                  }}
                >
                  +{step.parameters.length - 3} more...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Request Body */}
        {requestBody && (
          <div style={{ padding: '12px', borderBottom: '1px solid var(--arazzo-border)' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--arazzo-muted-fg)',
                marginBottom: '6px',
              }}
            >
              REQUEST BODY:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {requestBody.contentType && (
                <span
                  style={{ fontSize: '11px', color: 'var(--arazzo-fg-lighter)', fontWeight: 500 }}
                >
                  {requestBody.contentType}
                </span>
              )}
              <button
                type="button"
                className="nodrag nopan"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRequestBody(true);
                }}
                style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--arazzo-info-border)',
                  background: 'var(--arazzo-info-bg)',
                  color: 'var(--arazzo-info)',
                  cursor: 'pointer',
                }}
              >
                View
              </button>
            </div>
          </div>
        )}
        {showRequestBody && requestBody && (
          <RequestBodyDialog
            stepId={step.stepId}
            requestBody={requestBody}
            onClose={() => setShowRequestBody(false)}
          />
        )}

        {/* Outputs */}
        {hasOutputs && (
          <div style={{ padding: '12px', borderBottom: '1px solid var(--arazzo-border)' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--arazzo-muted-fg)',
                marginBottom: '6px',
              }}
            >
              OUTPUTS:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.entries(step.outputs || {})
                .slice(0, 3)
                .map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      fontSize: '11px',
                      color: 'var(--arazzo-fg-lighter)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>•</span>
                    <span style={{ fontWeight: 500 }}>{key}</span>
                    <span style={{ color: 'var(--arazzo-accent-orange)', fontSize: '10px' }}>
                      → {value}
                    </span>
                  </div>
                ))}
              {step.outputs && Object.keys(step.outputs).length > 3 && (
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--arazzo-subtle-fg)',
                    fontStyle: 'italic',
                  }}
                >
                  +{Object.keys(step.outputs).length - 3} more...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Criteria */}
        {hasSuccessCriteria && (
          <div style={{ padding: '12px', borderBottom: '1px solid var(--arazzo-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>✓</span>
              <span style={{ fontSize: '11px', color: 'var(--arazzo-success)', fontWeight: 500 }}>
                {step.successCriteria?.[0]?.condition || 'Has success criteria'}
              </span>
            </div>
          </div>
        )}

        {/* onSuccess Actions */}
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

        {/* onFailure Actions */}
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
                        background: 'var(--arazzo-danger)',
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

        {/* Sequential output handle at bottom (always present for fallback flow) */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="sequential"
          style={{ background: 'var(--arazzo-border-hover)' }}
        />
      </div>
    </>
  );
};
