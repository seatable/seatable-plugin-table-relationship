import { BaseEdge, EdgeProps, Position } from 'reactflow';

function HorizontalTangentEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerStart,
  markerEnd,
  style,
}: EdgeProps) {
  const deltaX = Math.abs(targetX - sourceX);
  const deltaY = Math.abs(targetY - sourceY);
  const strength = Math.min(deltaY * 0.4, 100) + (100 - Math.min(deltaX, 100)) * 0.75;

  const sourceSign = sourcePosition === Position.Left ? -1 : 1;
  const targetSign = targetPosition === Position.Left ? -1 : 1;

  const path = `M ${sourceX},${sourceY} C ${sourceX + sourceSign * strength},${sourceY} ${
    targetX + targetSign * strength
  },${targetY} ${targetX},${targetY}`;

  return <BaseEdge path={path} markerStart={markerStart} markerEnd={markerEnd} style={style} />;
}

export default HorizontalTangentEdge;
