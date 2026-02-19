import React from 'react';
import { useArazzoViewer } from '../context/ArazzoViewerContext';

export interface WorkflowTabsProps {
  /** Called when workflow tab is selected */
  onWorkflowSelect?: (workflowId: string) => void;
}

/**
 * WorkflowTabs - Tab-based workflow navigation
 * Shows all workflows at a glance with single-click switching
 */
export const WorkflowTabs: React.FC<WorkflowTabsProps> = ({ onWorkflowSelect }) => {
  const { document: arazzoDoc, activeWorkflowId, setActiveWorkflow } = useArazzoViewer();

  const handleTabClick = (workflowId: string) => {
    setActiveWorkflow(workflowId);
    onWorkflowSelect?.(workflowId);
  };

  // Don't render if no workflows
  if (arazzoDoc.workflows.length === 0) {
    return (
      <div className="arazzo-workflow-tabs arazzo-workflow-tabs--empty">
        <span className="arazzo-workflow-tabs__empty-text">No workflows</span>
      </div>
    );
  }

  return (
    <div className="arazzo-workflow-tabs">
      <div className="arazzo-workflow-tabs__list">
        {arazzoDoc.workflows.map((workflow) => {
          const isActive = workflow.workflowId === activeWorkflowId;
          return (
            <button
              key={workflow._internalId || workflow.workflowId}
              className={`arazzo-workflow-tabs__tab ${isActive ? 'arazzo-workflow-tabs__tab--active' : ''}`}
              onClick={() => handleTabClick(workflow.workflowId)}
              title={workflow.workflowId}
            >
              <span className="arazzo-workflow-tabs__tab-label">{workflow.workflowId}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowTabs;
