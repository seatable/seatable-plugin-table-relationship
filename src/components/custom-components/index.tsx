import React, { useEffect, useCallback, useState } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  isNode,
} from 'reactflow';
import {
  IERDPluginProps,
  NodeResultItem,
} from '../../utils/Interfaces/custom-interfaces/ERDPlugin';
import CustomNode from './erd/CustomNode';
import './erd/overview.css';

// Import styles once
import 'reactflow/dist/style.css';

// Import utils
import { generateEdges, generateNodes, getParams } from '../../utils/customUtils/utils';

const nodeTypes = {
  custom: CustomNode,
};
// const edgeTypes: any = {
//   floating: CustomEdge as ComponentType<EdgeProps>,
// };

const ERDPlugin: React.FC<IERDPluginProps> = ({ links, allTables }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [prevNodePositions, setPrevNodePositions]: any = useState({});

  useEffect(() => {
    // console.log('new edges received', edges);
  }, [edges]);

  useEffect(() => {
    try {
      if (links && allTables) {
        const ns = generateNodes(allTables);
        const es = generateEdges(links, allTables, ns);
        setNodes(ns);
        setEdges(es);
      }
    } catch (error) {
      console.error('Error processing data:', error);
    }
  }, [allTables]);

  const onNodeDragStart = useCallback(
    (event, node) => {
      // Store the current position of all nodes when dragging starts
      const positions: { [key: string]: { x: number; y: number } } = {};
      nodes.forEach((n) => {
        positions[n.id] = { x: n.position.x, y: n.position.y };
      });
      setPrevNodePositions(positions);
    },
    [nodes]
  );

  const onNodeDrag = useCallback(
    (event, node) => {
      if (isNode(node) && links && allTables) {
        // Node position is continuously changing, update node's position in state
        const updatedNodes = nodes.map((n) => {
          if (n.id === node.id) {
            // Update node's position in state
            return {
              ...n,
              position: node.position,
              data: {
                ...n.data,
                position: node.position,
              },
            };
          }
          return n;
        }) as NodeResultItem[];

        setNodes(updatedNodes);
        updatedNodes.forEach((n) => {
          const prevNodePosition = prevNodePositions[n.id];
          const centerSrc = node.position.x < prevNodePosition.x + 90;
          // const params = getParams(node, n);
          // console.log('first', params);
          // Check if the dragged node is TOTAL less than another node
          if (prevNodePosition && n.id !== node.id && centerSrc) {
            console.log(`${node.id} is TOTAL less than ${n.id}`);

            // Update the related edge between node.id and n.id
            const updatedEdges = edges.map((edge) => {
              if (edge.source === n.id && edge.target === node.id) {
                console.log('here', 0);
                // Update the sourceHandle and targetHandle accordingly
                return {
                  ...edge,
                  sourceHandle: edge.sourceHandle?.replace('_r-', '_l-'),
                  targetHandle: edge.targetHandle?.replace('_l-', '_r-'),
                };
              }
              return edge;
            });
            setEdges(updatedEdges);
          }
        });
      }
    },
    [nodes, setNodes, prevNodePositions]
  );

  return (
    <ReactFlow
      key={nodes.length}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStart={onNodeDragStart}
      onNodeDrag={onNodeDrag}
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
