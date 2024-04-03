import React, { useEffect, useCallback } from 'react';
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

// Import utils
import { generateEdges, generateNodes } from '../../../utils/customUtils/ERDUtils';

const nodeTypes = {
  custom: CustomNode,
};

const ERDPlugin: React.FC<IERDPluginProps> = ({ links, allTables }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    try {
      if (links && allTables) {
        const ns = generateNodes(allTables);
        setNodes(ns);
        console.log('ns', ns);
        const es = generateEdges(links, allTables);
        setEdges(es);
      }
    } catch (error) {
      console.error('Error processing data:', error);
    }
  }, [allTables]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  return (
    <ReactFlow
      key={nodes.length}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
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
