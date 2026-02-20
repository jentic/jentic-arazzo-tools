import React, { useState } from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';
import { RetryEdgeData } from '../types/index';

// Generate a path that routes to the left side, with offset based on distance jumped
function getLeftRoutedPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  isBackward: boolean,
  baseOffset: number = 120,
): { path: string; labelX: number; labelY: number } {
  const verticalDistance = Math.abs(targetY - sourceY);
  // Increase offset based on how far we're jumping (more nodes = further left)
  const dynamicOffset = baseOffset + Math.min(verticalDistance * 0.15, 150);
  const leftX = Math.min(sourceX, targetX) - dynamicOffset;
  const radius = 8;

  if (isBackward) {
    // Source is below target, need to go up
    const path = `M ${sourceX} ${sourceY}
      L ${leftX + radius} ${sourceY}
      Q ${leftX} ${sourceY} ${leftX} ${sourceY - radius}
      L ${leftX} ${targetY + radius}
      Q ${leftX} ${targetY} ${leftX + radius} ${targetY}
      L ${targetX} ${targetY}`;
    return { path, labelX: leftX, labelY: (sourceY + targetY) / 2 };
  } else {
    // Source is above target, going down
    const path = `M ${sourceX} ${sourceY}
      L ${leftX + radius} ${sourceY}
      Q ${leftX} ${sourceY} ${leftX} ${sourceY + radius}
      L ${leftX} ${targetY - radius}
      Q ${leftX} ${targetY} ${leftX + radius} ${targetY}
      L ${targetX} ${targetY}`;
    return { path, labelX: leftX, labelY: (sourceY + targetY) / 2 };
  }
}

export const RetryEdge: React.FC<EdgeProps<RetryEdgeData>> = ({
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
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Retry edges typically go backward (to retry a step), so use custom routing
  const isBackward = targetY < sourceY;
  const isLongJump = Math.abs(targetY - sourceY) > 100;
  const isHorizontal = Math.abs(targetX - sourceX) > 100 && Math.abs(targetY - sourceY) < 50; // Mostly horizontal (external workflow)

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (isHorizontal) {
    // Simple straight line for horizontal edges to external workflows
    edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    labelX = (sourceX + targetX) / 2;
    labelY = sourceY - 10;
  } else if (isLongJump) {
    const routed = getLeftRoutedPath(sourceX, sourceY, targetX, targetY, isBackward);
    edgePath = routed.path;
    labelX = routed.labelX;
    labelY = routed.labelY;
  } else {
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

  const retryInfo = data?.retryLimit ? `retry: ${data.retryLimit}x` : 'retry';
  const delayInfo = data?.retryAfter ? ` @ ${data.retryAfter}s` : '';
  const label = `${retryInfo}${delayInfo}`;

  // Amber color for retry
  const baseColor = '#f59e0b';
  const strokeColor = selected ? '#3b82f6' : isHovered ? '#fbbf24' : baseColor;
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
          strokeDasharray: '5,5',
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
