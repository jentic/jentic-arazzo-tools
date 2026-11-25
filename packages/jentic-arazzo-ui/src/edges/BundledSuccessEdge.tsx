import React, { useState, useMemo } from 'react';
import { EdgeProps, EdgeLabelRenderer, internalsSymbol, useReactFlow, useStore } from 'reactflow';
import { BundledSuccessEdgeData } from '../types/index';
import { useArazzoViewer } from '../context/ArazzoViewerContext';
import { getInheritedSuccessActionYOffset } from '../utils/nodeLayout';

export const BundledSuccessEdge: React.FC<EdgeProps<BundledSuccessEdgeData>> = ({
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

  const nodeInternals = useStore((state) => state.nodeInternals);
  const sources = useMemo(
    () =>
      (data?.sources ?? []).flatMap((source) => {
        const node = nodeInternals.get(source.nodeId);
        if (!node) return [];
        const handle = node[internalsSymbol]?.handleBounds?.source?.find(
          (h) => h.id === source.handleId,
        );
        const right = node.position.x + (node.width ?? 420);
        return [
          {
            id: source.nodeId,
            x: handle ? node.position.x + handle.x + handle.width : right,
            y:
              node.position.y +
              (handle ? handle.y + handle.height / 2 : getInheritedSuccessActionYOffset(node)),
            gutterX: right + 12,
            // cross the row above the cards so a left sibling can reach the bundle.
            gutterY: node.position.y - 10,
          },
        ];
      }),
    [data, nodeInternals],
  );
  if (!data || !sources.length) return null;

  const bundleLineX =
    Math.max(...nodes.map((n) => n.position.x + (n.width ?? 420))) + 60 + data.actionIdx * 40;
  const approachY = targetY - 20;
  const minY = Math.min(approachY, ...sources.map((s) => s.gutterY));
  const maxY = Math.max(approachY, ...sources.map((s) => s.gutterY));
  // Base color for success edges
  const baseColor = 'var(--arazzo-success)';
  const strokeColor = selected
    ? 'var(--arazzo-ring)'
    : isHovered
      ? 'var(--arazzo-success-hover)'
      : baseColor;
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

  const mainPath = `M ${bundleLineX} ${minY} V ${maxY} M ${bundleLineX} ${approachY} H ${targetX} V ${targetY}`;
  const labelX = bundleLineX + 15;
  const labelY = (minY + maxY) / 2;

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Stub lines from each source to bundle line */}
      {sources.map((pos) => (
        <path
          key={pos.id}
          d={`M ${pos.x} ${pos.y} H ${pos.gutterX} V ${pos.gutterY} H ${bundleLineX}`}
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
          strokeWidth={8}
          strokeOpacity={0.2}
          style={{ stroke: 'var(--arazzo-ring)', pointerEvents: 'none' }}
        />
      )}

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            fontWeight: 600,
            background: selected ? 'var(--arazzo-ring)' : baseColor,
            color: 'var(--arazzo-on-accent)',
            padding: '2px 6px',
            borderRadius: 4,
            pointerEvents: 'all',
            cursor: 'pointer',
            boxShadow: isHovered || selected ? 'var(--arazzo-shadow-label)' : 'none',
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
