import React, { useState } from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer, useReactFlow } from 'reactflow';
import { SuccessEdgeData } from '../types/index';
import { useArazzoViewer } from '../context/ArazzoViewerContext';

// Generate a path that routes to the right side, with offset based on distance jumped
function getRightRoutedPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  isBackward: boolean,
  baseOffset: number = 120,
): { path: string; labelX: number; labelY: number } {
  const verticalDistance = Math.abs(targetY - sourceY);
  // Increase offset based on how far we're jumping (more nodes = further right)
  const dynamicOffset = baseOffset + Math.min(verticalDistance * 0.15, 150);
  const rightX = Math.max(sourceX, targetX) + dynamicOffset;
  const radius = 8;

  if (isBackward) {
    // Source is below target, need to go up
    const path = `M ${sourceX} ${sourceY}
      L ${rightX - radius} ${sourceY}
      Q ${rightX} ${sourceY} ${rightX} ${sourceY - radius}
      L ${rightX} ${targetY + radius}
      Q ${rightX} ${targetY} ${rightX - radius} ${targetY}
      L ${targetX} ${targetY}`;
    return { path, labelX: rightX, labelY: (sourceY + targetY) / 2 };
  } else {
    // Source is above target, going down
    const path = `M ${sourceX} ${sourceY}
      L ${rightX - radius} ${sourceY}
      Q ${rightX} ${sourceY} ${rightX} ${sourceY + radius}
      L ${rightX} ${targetY - radius}
      Q ${rightX} ${targetY} ${rightX - radius} ${targetY}
      L ${targetX} ${targetY}`;
    return { path, labelX: rightX, labelY: (sourceY + targetY) / 2 };
  }
}

export const SuccessEdge: React.FC<EdgeProps<SuccessEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
  target,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const reactFlow = useReactFlow();
  const { nodes, setSelectedNode } = useArazzoViewer();

  // Determine if this is a non-sequential jump (goto to non-adjacent node)
  const isBackward = targetY < sourceY;
  const isLongJump = Math.abs(targetY - sourceY) > 100; // More than ~1 node height
  const isHorizontal = Math.abs(targetX - sourceX) > 100 && Math.abs(targetY - sourceY) < 50; // Mostly horizontal (external workflow)

  // Use custom routing for goto edges that jump multiple nodes
  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (isHorizontal) {
    // Simple straight line for horizontal edges to external workflows
    edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    labelX = (sourceX + targetX) / 2;
    labelY = sourceY - 10;
  } else if (isLongJump && data?.action.type === 'goto') {
    const routed = getRightRoutedPath(sourceX, sourceY, targetX, targetY, isBackward);
    edgePath = routed.path;
    labelX = routed.labelX;
    labelY = routed.labelY;
  } else if (isLongJump && data?.action.type === 'end') {
    // End edges use a smaller offset since they don't need to avoid nodes
    const routed = getRightRoutedPath(sourceX, sourceY, targetX, targetY, isBackward, 40);
    edgePath = routed.path;
    labelX = routed.labelX;
    labelY = routed.labelY;
  } else {
    // Use default smooth step for short/sequential edges
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 8,
    });
  }

  // Use action name as the label (the conditional name from source step)
  const label = data?.action.name || (data?.action.type === 'end' ? 'end' : '');

  // Success edges are always green
  const baseColor = '#10b981';
  const strokeColor = selected ? '#3b82f6' : isHovered ? '#34d399' : baseColor;
  const strokeWidth = selected ? 3 : isHovered ? 2.5 : 2;

  // Navigate to target node when clicked (not for end actions which have no target)
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.action.type !== 'end' && target) {
      const targetNode = nodes.find((n) => n.id === target);
      if (targetNode && targetNode.position) {
        setSelectedNode(target);
        reactFlow.setCenter(targetNode.position.x + 150, targetNode.position.y + 100, {
          zoom: reactFlow.getZoom(),
          duration: 300,
        });
      }
    }
  };

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Invisible wider path for better hit detection */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        style={{ cursor: 'pointer' }}
      />
      {/* Visible edge */}
      <path
        id={id}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth,
          transition: 'stroke 0.15s ease, stroke-width 0.15s ease',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {/* Selection glow effect */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={8}
          strokeOpacity={0.2}
          style={{ pointerEvents: 'none' }}
        />
      )}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            fontWeight: 600,
            background: selected ? '#3b82f6' : baseColor,
            color: '#fff',
            padding: '2px 6px',
            borderRadius: 4,
            pointerEvents: 'all',
            cursor: 'pointer',
            boxShadow: isHovered || selected ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            transition: 'background 0.15s ease, box-shadow 0.15s ease',
          }}
          className="nodrag nopan"
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </g>
  );
};
