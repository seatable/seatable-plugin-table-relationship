import React, { useEffect, useCallback, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  isNode,
} from 'reactflow';
import {
  IERDPluginProps,
  ILinksData,
  INodePositions,
  NodeResultItem,
  nodeCts,
} from '../../utils/custom-interfaces/ERDPlugin';
import CustomNode from './erd/CustomNode';

// Import styles once
import 'reactflow/dist/style.css';
import '../../styles/custom-styles/overview.css';

// Import utils
import { generateEdges, generateLinks, generateNodes } from '../../utils/custom-utils/utils';
import { LINK_TYPE } from '../../utils/custom-constants/constants';
import { PLUGIN_NAME } from '../../utils/template-constants';
import { TableArray } from '../../utils/template-interfaces/Table.interface';

const nodeTypes = {
  custom: CustomNode,
};

const ERDPlugin: React.FC<IERDPluginProps> = ({ allTables, relationship, pluginDataStore }) => {
  const [_allTables, setAllTables] = useState<TableArray>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [links, setLinks] = useState<ILinksData[]>([]);
  const [nodesCts, setNodesCts] = useState<nodeCts[]>([]);
  const [prevNodePositions, setPrevNodePositions]: [
    INodePositions,
    React.Dispatch<React.SetStateAction<INodePositions>>,
  ] = useState({});

  useEffect(() => {
    console.log('useEffect');
    let totalCount = 0;
    let lnk = generateLinks(allTables);
    const ns = generateNodes(allTables);
    const es = generateEdges(lnk, ns);
    console.log('ns', ns);
    // if (nodes.length === 0) {
    //   setLinks(lnk);
    //   setNodes(ns);
    //   setEdges(es);
    // }
    if (
      ns.length === pluginDataStore?.erdPluginData?.nodes.length &&
      lnk.length === pluginDataStore?.erdPluginData?.links.length &&
      es.length === pluginDataStore?.erdPluginData?.edges.length
    ) {
      console.log('PluginDataStore Reigns');
      const { nodes, links, edges } = pluginDataStore.erdPluginData;
      setLinks(links);
      setNodes(nodes);
      setEdges(edges);
    } else {
      console.log('we are in the else');
      setLinks(lnk);
      setNodes(ns);
      setEdges(es);
    }

    // setAllTables(allTables);
    // if (!relationship.recRel) {
    //   lnk = lnk.filter((obj) => obj.type !== LINK_TYPE.link);
    // }
    // if (!relationship.lkRel) {
    //   lnk = lnk.filter((obj) => obj.type !== LINK_TYPE.formula);
    // }
    // if (!relationship.lk2Rel) {
    //   lnk = lnk.filter((obj) => obj.type !== LINK_TYPE.formula2nd);
    // }
    // setLinks(lnk);
    // setNodes(ns);
    // setEdges(es);
    // window.dtableSDK.updatePluginSettings(PLUGIN_NAME, {
    //   ...pluginDataStore,
    //   erdPluginData: { nodes: ns, links: lnk, edges: es },
    // });

    // allTables.forEach((t) => {
    //   allTables.forEach((table) => {
    //     if (table.columns) {
    //       table.columns.forEach((column) => {
    //         if (
    //           (column.key !== undefined && column.type === LINK_TYPE.link) ||
    //           column.type === LINK_TYPE.formula2nd ||
    //           column.type === LINK_TYPE.formula
    //         ) {
    //           totalCount++;
    //         }
    //       });
    //     }
    //   });
    // });
    // console.log('totalCount', totalCount);

    // console.log('useEffect', 0);
    // if (nodes.length !== 0) {
    //   console.log('nodes is NOT empty', nodes);
    //   if (allTables) {
    //     setAllTables(allTables);
    //     let lnk = generateLinks(allTables);
    //     if (!relationship.recRel) {
    //       lnk = lnk.filter((obj) => obj.type !== LINK_TYPE.link);
    //     }
    //     if (!relationship.lkRel) {
    //       lnk = lnk.filter((obj) => obj.type !== LINK_TYPE.formula);
    //     }
    //     if (!relationship.lk2Rel) {
    //       lnk = lnk.filter((obj) => obj.type !== LINK_TYPE.formula2nd);
    //     }
    //     setLinks(lnk);
    //     const ns = generateNodes(allTables);
    //     setNodes(ns);
    //     const es = generateEdges(lnk, ns);
    //     setEdges(es);
    //     const { nodes, links, edges } = pluginDataStore.erdPluginData!;
    //     console.log('nodes.length', nodes.length);
    //     console.log('ns.length', ns.length);
    //   }
    // }
    // if (nodes.length === 0 && pluginDataStore.erdPluginData) {
    //   console.log('nodes is empty');
    //   const { nodes, links, edges } = pluginDataStore.erdPluginData;
    //   setNodes(nodes);
    //   setLinks(links);
    //   setEdges(edges);
    //   setAllTables(allTables);
    // }
  }, [JSON.stringify(allTables), relationship]);

  // useEffect(() => {
  //   try {
  //     // console.log('going to generate nodes and edges');
  //     if (allTables) {
  //       let lnk = generateLinks(allTables);

  //       if (!relationship.recRel) {
  //         lnk = lnk.filter((obj) => obj.type !== LINK_TYPE.link);
  //       }
  //       if (!relationship.lkRel) {
  //         lnk = lnk.filter((obj) => obj.type !== LINK_TYPE.formula);
  //       }
  //       if (!relationship.lk2Rel) {
  //         lnk = lnk.filter((obj) => obj.type !== LINK_TYPE.formula2nd);
  //       }
  //       setLinks(lnk);
  //       const ns = generateNodes(allTables);
  //       setNodes(ns);
  //       const es = generateEdges(lnk, ns);
  //       setEdges(es);
  //       window.dtableSDK.updatePluginSettings(PLUGIN_NAME, {
  //         ...pluginDataStore,
  //         erdPluginData: { nodes: ns, links: lnk, edges: es },
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error processing data:', error);
  //   }
  // }, [allTables, relationship]);

  function isDataEqual() {
    console.log('checking if data is equal');
  }

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

  const onNodeDragStop = useCallback(
    (event, node) => {
      console.log('drag stop');
      window.dtableSDK.updatePluginSettings(PLUGIN_NAME, {
        ...pluginDataStore,
        erdPluginData: { nodes: nodes, links: links, edges: edges },
      });
    },
    [nodes]
  );

  return (
    <>
      {/* <p>{allTables.length}</p> */}
      <ReactFlow
        key={nodes.length}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onEdgeClick={(event, edge) => console.log('edge clicked', edge)}
        onEdgeMouseLeave={(event, edge) => console.log('edge mouse leave', edge)}
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
    </>
  );
};

export default ERDPlugin;
