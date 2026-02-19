import React, { useState, useMemo } from 'react';
import { EdgeProps, EdgeLabelRenderer, useReactFlow } from 'reactflow';
import { BundledFailureEdgeData } from '../types/index';
import { useArazzoViewer } from '../context/ArazzoViewerContext';
import { getInheritedFailureActionYOffset } from '../utils/nodeLayout';

export const BundledFailureEdge: React.FC<EdgeProps<BundledFailureEdgeData>> = ({
  id,
  targetX,
  targetY,
  style = {},
  markerEnd,
  data,
  selected,
  target,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const reactFlow = useReactFlow();
  const { nodes, setSelectedNode } = useArazzoViewer();

  // Get positions for all source handles from the DOM
  // Recalculate whenever nodes change
  const sourcePositions = useMemo(() => {
    if (!data?.sources || data.sources.length === 0) return [];

    return data.sources
      .map((src) => {
        // Query the actual handle element from the DOM
        const handleSelector = `[data-nodeid="${src.nodeId}"][data-handleid="${src.handleId}"]`;
        const handleElement = document.querySelector(handleSelector);

        if (!handleElement) {
          // Fallback: use node position if handle not found
          const node = nodes.find((n) => n.id === src.nodeId);
          if (!node?.position) return null;
          const yOffset = getInheritedFailureActionYOffset(node);
          return {
            x: node.position.x,
            y: node.position.y + yOffset,
            nodeId: src.nodeId,
          };
        }

        // Get the actual screen position of the handle
        const rect = handleElement.getBoundingClientRect();
        const flowElement = document.querySelector('.react-flow');
        if (!flowElement) return null;

        const flowRect = flowElement.getBoundingClientRect();
        const zoom = reactFlow.getZoom();
        const { x: viewX, y: viewY } = reactFlow.getViewport();

        // Convert screen coordinates to flow coordinates
        const x = (rect.left + rect.width / 2 - flowRect.left) / zoom - viewX;
        const y = (rect.top + rect.height / 2 - flowRect.top) / zoom - viewY;

        return { x, y, nodeId: src.nodeId };
      })
      .filter((p) => p !== null) as Array<{ x: number; y: number; nodeId: string }>;
  }, [data?.sources, nodes, reactFlow]);

  if (!data || sourcePositions.length === 0) return null;

  // Calculate bundle line X position (left of all sources)
  // Use actionIdx to offset multiple bundled edges horizontally to prevent overlap
  const minSourceX = Math.min(...sourcePositions.map((p) => p.x));
  const baseStubLength = 60;
  const horizontalSpacing = 40; // Space between parallel bundled edges
  const bundleLineX = minSourceX - (baseStubLength + data.actionIdx * horizontalSpacing);

  // Calculate bundle line Y range (top to bottom of all sources)
  const minY = Math.min(...sourcePositions.map((p) => p.y));
  const maxY = Math.max(...sourcePositions.map((p) => p.y));

  // Base color for failure edges
  const baseColor = '#ef4444';
  const strokeColor = selected ? '#3b82f6' : isHovered ? '#f87171' : baseColor;
  const stubWidth = selected ? 2 : isHovered ? 1.5 : 1;
  const mainWidth = selected ? 3 : isHovered ? 2.5 : 2;

  // Navigate to target node when clicked
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (target) {
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

  // Create path for main bundled line
  const isBackward = targetY < minY;
  const radius = 8;
  const approachOffset = 20; // Approach target from 20px higher

  let mainPath: string;
  let labelX: number;
  let labelY: number;

  if (isBackward) {
    // Going up - approach from above, curve down to target
    const approachY = targetY - approachOffset;
    mainPath = `M ${bundleLineX} ${maxY}
      L ${bundleLineX} ${minY}
      L ${bundleLineX} ${approachY + radius}
      Q ${bundleLineX} ${approachY} ${bundleLineX + radius} ${approachY}
      L ${targetX - radius} ${approachY}
      Q ${targetX} ${approachY} ${targetX} ${approachY + radius}
      L ${targetX} ${targetY}`;
    labelX = bundleLineX - 15;
    labelY = (minY + maxY) / 2;
  } else {
    // Going down - approach from above, curve down to target
    const approachY = targetY - approachOffset;
    mainPath = `M ${bundleLineX} ${minY}
      L ${bundleLineX} ${maxY}
      L ${bundleLineX} ${approachY + radius}
      Q ${bundleLineX} ${approachY} ${bundleLineX + radius} ${approachY}
      L ${targetX - radius} ${approachY}
      Q ${targetX} ${approachY} ${targetX} ${approachY + radius}
      L ${targetX} ${targetY}`;
    labelX = bundleLineX - 15;
    labelY = (minY + maxY) / 2;
  }

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Stub lines from each source to bundle line */}
      {sourcePositions.map((pos, idx) => (
        <path
          key={`stub-${idx}`}
          d={`M ${pos.x} ${pos.y} L ${bundleLineX} ${pos.y}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stubWidth}
          style={{ transition: 'stroke 0.15s ease, stroke-width 0.15s ease' }}
        />
      ))}

      {/* Invisible wider path for better hit detection on main line */}
      <path
        d={mainPath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        style={{ cursor: 'pointer' }}
      />

      {/* Main bundled line */}
      <path
        id={id}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: mainWidth,
          transition: 'stroke 0.15s ease, stroke-width 0.15s ease',
        }}
        className="react-flow__edge-path"
        d={mainPath}
        markerEnd={markerEnd}
      />

      {/* Selection glow effect */}
      {selected && (
        <path
          d={mainPath}
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
          {data?.action.name || 'inherited'}
        </div>
      </EdgeLabelRenderer>
    </g>
  );
};
