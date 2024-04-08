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
  nodeCts,
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
  const [nodesCts, setNodesCts] = useState<nodeCts[]>([]);
  const [prevNodePositions, setPrevNodePositions]: any = useState({});

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

        const nodeDataArray = updatedNodes.map((node) => {
          return { n: node.id, cts: node.position.x };
        });
        setNodesCts(nodeDataArray);

        const updatedEdges = edges.map((e) => {
          const sourceNode = nodeDataArray.find((node) => node.n === e.source);
          const targetNode = nodeDataArray.find((node) => node.n === e.target);

          if (sourceNode && targetNode) {
            if (sourceNode.cts + 90 < targetNode.cts) {
              return {
                ...e,
                sourceHandle: e.sourceHandle?.replace('_l-', '_r-'),
                targetHandle: e.targetHandle?.replace('_r-', '_l-'),
              };
            } else {
              return {
                ...e,
                sourceHandle: e.sourceHandle?.replace('_r-', '_l-'),
                targetHandle: e.targetHandle?.replace('_l-', '_r-'),
              };
            }
          }
          return e;
        });
        setEdges(updatedEdges);
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
