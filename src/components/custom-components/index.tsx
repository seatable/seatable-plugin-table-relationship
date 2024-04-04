import React, { useEffect, useCallback, ComponentType } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  EdgeTypes,
  EdgeProps,
  MarkerType,
} from 'reactflow';
import { IERDPluginProps } from '../../utils/Interfaces/custom-interfaces/ERDPlugin';
import CustomNode from './erd/CustomNode';
import CustomEdge from './erd/CustomEdge';
import './erd/overview.css';

// Import styles once
import 'reactflow/dist/style.css';

// Import utils
import { generateEdges, generateNodes } from '../../utils/customUtils/utils';

const nodeTypes = {
  custom: CustomNode,
};
// const edgeTypes: any = {
//   floating: CustomEdge as ComponentType<EdgeProps>,
// };

const ERDPlugin: React.FC<IERDPluginProps> = ({ links, allTables }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    try {
      if (links && allTables) {
        const ns = generateNodes(allTables);
        const es = generateEdges(links, allTables);
        setNodes(ns);
        setEdges(es);
      }
    } catch (error) {
      console.error('Error processing data:', error);
    }
  }, [allTables]);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, type: 'floating', markerEnd: { type: MarkerType.Arrow } }, eds)
      ),
    []
  );

  return (
    <ReactFlow
      key={nodes.length}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
      nodeTypes={nodeTypes}
      // edgeTypes={edgeTypes}
      >
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
