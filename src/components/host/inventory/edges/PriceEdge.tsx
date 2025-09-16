import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@xyflow/react';

interface PriceEdgeData {
  relationship?: 'contains' | 'requires' | 'modifies' | 'custom';
  quantity?: number;
}

export function PriceEdge({
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
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = (data || {}) as PriceEdgeData;
  const relationshipColors = {
    contains: '#8B5CF6',
    requires: '#10B981', 
    modifies: '#F59E0B',
    custom: '#6B7280'
  };

  const relationshipLabels = {
    contains: '📁',
    requires: '🔗',
    modifies: '⚙️',
    custom: '↔️'
  };

  const color = relationshipColors[edgeData?.relationship || 'custom'];
  const label = relationshipLabels[edgeData?.relationship || 'custom'];

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ 
          ...style, 
          stroke: color,
          strokeWidth: 2,
          strokeDasharray: edgeData?.relationship === 'modifies' ? '5,5' : undefined
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-sm pointer-events-none"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          {label}
          {edgeData?.quantity && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {edgeData.quantity}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}