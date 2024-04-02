import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import { IERDPluginProps } from '../../../utils/Interfaces/custom-interfaces/ERDPlugin';
import CustomNode from './CustomNode';
import './overview.css';

// Import styles once
import 'reactflow/dist/style.css';

// Import constants
import {
  _nodes as initialNodes,
  _edges as initialEdges,
} from '../../../utils/customUtils/constants';


const ERDPlugin: React.FC<IERDPluginProps> = ({ entities, appActiveState }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const nodeTypes = {
    custom: CustomNode,
  };
  useEffect(() => {
    console.log('appActiveState', appActiveState);
  }, []);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
      attributionPosition="top-right"
      nodeTypes={nodeTypes}>
      <MiniMap
        style={{
          height: 120,
        }}
        zoomable
        pannable
      />
      <Controls />
      <Background color="#aaa" gap={16} />
    </ReactFlow>
  );
};

export default ERDPlugin;
