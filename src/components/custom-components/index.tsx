import React, { useEffect, useCallback, useState } from 'react';
import { FaPlus } from 'react-icons/fa6';

import ReactFlow, {
  Controls,
  useNodesState,
  useEdgesState,
  isNode,
  Edge,
  ControlButton,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import {
  IERDPluginProps,
  ILinksData,
  INodePositions,
  NodeResultItem,
  nodeCts,
} from '../../utils/custom-interfaces/ERDPlugin';
import CustomNode from './NodesComponent/CustomNode';

// Import styles once
import 'reactflow/dist/style.css';
import '../../styles/custom-styles/overview.css';

// Import utils
import {
  generateEdges,
  generateLinks,
  generateNodes,
  filterRelationshipLinks,
} from '../../utils/custom-utils/utils';
import { PLUGIN_NAME } from '../../utils/template-constants';
import { TableArray } from '../../utils/template-interfaces/Table.interface';
import { zoom } from 'd3';

const nodeTypes = {
  custom: CustomNode,
};

const ERDPlugin: React.FC<IERDPluginProps> = ({
  appActiveState,
  allTables,
  pluginDataStore,
  relationship,
}) => {
  const [_allTables, setAllTables] = useState<TableArray>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [links, setLinks] = useState<ILinksData[]>([]);
  const [nodesCts, setNodesCts] = useState<nodeCts[]>([]);
  const [prevNodePositions, setPrevNodePositions]: [
    INodePositions,
    React.Dispatch<React.SetStateAction<INodePositions>>,
  ] = useState({});
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    const PRESET_ID = appActiveState.activePresetId;
    const presetIndex = pluginDataStore.presets.findIndex((preset) => preset._id === PRESET_ID);
    const pluginPresetData = pluginDataStore.presets[presetIndex].customSettings;
    if (pluginPresetData) {
      let lnk = generateLinks(allTables);
      const filteredLinks = filterRelationshipLinks(lnk, relationship);
      const ns = generateNodes(allTables, relationship);
      const es = generateEdges(filteredLinks, ns);

      const nodes = pluginPresetData.nodes;
      const nsIds = ns.map((node) => node.id);
      const nodesIds = nodes.map((node: NodeResultItem) => node.id);

      if (nsIds.length === nodesIds.length && nsIds.every((id) => nodesIds.includes(id))) {
        let differingObjects = [];

        for (let i = 0; i < ns.length; i++) {
          if (ns[i].data.columns.length !== nodes[i].data.columns.length) {
            differingObjects.push(ns[i]);
          }
        }

        if (differingObjects.length > 0) {
          differingObjects.forEach((obj) => {
            const correspondingNode = nodes.find((node: NodeResultItem) => node.id === obj.id);

            if (correspondingNode) {
              correspondingNode.data.columns = obj.data.columns;
            }
          });
        } else {
          setNodes(nodes);
          const _es = generateEdges(lnk, nodes);
          setEdges(_es);
          setPluginDataStore(nodes, lnk, _es);
        }
        setLinks(filteredLinks);
        setNodes(nodes);
        const _es = generateEdges(filteredLinks, nodes);
        setEdges(_es);
        setPluginDataStore(nodes, filteredLinks, es);
      } else {
        const missingIds = nsIds.filter((id) => !nodesIds.includes(id));
        const extraIds = nodesIds.filter((id: string) => !nsIds.includes(id));
        const updatedNodes = [...nodes, ...ns.filter((node) => missingIds.includes(node.id))];
        const filteredNodes = updatedNodes.filter(
          (node: NodeResultItem) => !extraIds.includes(node.id)
        );
        let lnk = generateLinks(allTables);

        const es = generateEdges(lnk, filteredNodes);
        setNodes(filteredNodes);
        setEdges(es);
        setLinks(lnk);
        setPluginDataStore(filteredNodes, lnk, es);
      }
    } else {
      // THIS IS THE FIRST TIME THE PLUGIN IS LOADED and there is no data in the pluginDataStore
      let lnk = generateLinks(allTables);
      const ns = generateNodes(allTables, relationship);
      const es = generateEdges(lnk, ns);
      setNodes(ns);
      setEdges(es);
      setLinks(lnk);
      setPluginDataStore(ns, lnk, es);
    }
  }, [JSON.stringify(allTables), relationship, appActiveState.activePresetId]);

  function setPluginDataStore(ns: any[], lnk: ILinksData[], es: Edge[]) {
    window.dtableSDK.updatePluginSettings(PLUGIN_NAME, {
      ...pluginDataStore,
      presets: pluginDataStore.presets.map((preset) => {
        if (preset._id === appActiveState.activePresetId) {
          return {
            ...preset,
            customSettings: {
              ...preset.customSettings,
              nodes: ns,
              links: lnk,
              edges: es,
              relationship: relationship,
            },
          };
        }
        return preset;
      }),
    });
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
      node.data.selected = true;
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
      const updatedNodes = nodes.map((n) => {
        if (n.id === node.id) {
          // Update node's position in state
          return {
            ...n,

            data: {
              ...n.data,
              selected: false,
            },
          };
        }
        return n;
      }) as NodeResultItem[];

      setNodes(updatedNodes);
      setPluginDataStore(updatedNodes, links, edges);
    },
    [nodes]
  );

  return (
    <>
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
        fitView={true}
        nodeTypes={nodeTypes}></ReactFlow>
    </>
  );
};

export default ERDPlugin;
