import React, { useState } from 'react';
import { EdgeProps, getSmoothStepPath } from 'reactflow';
import { SequentialEdgeData } from '../types/index';

export const SequentialEdge: React.FC<EdgeProps<SequentialEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Use SmoothStep for orthogonal (right-angle) edges that route around nodes
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  // Edge color based on state
  const baseColor = '#6b7280';
  const strokeColor = selected ? '#3b82f6' : isHovered ? '#9ca3af' : baseColor;
  const strokeWidth = selected ? 3 : isHovered ? 2.5 : 2;

  return (
    <g onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
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
    </g>
  );
};
