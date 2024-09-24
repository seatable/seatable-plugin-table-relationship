import React, { useEffect, useCallback, useState, useMemo, memo } from 'react';

import ReactFlow, {
  useNodesState,
  useEdgesState,
  isNode,
  useViewport,
  useReactFlow,
} from 'reactflow';

import {
  IPluginTRProps,
  ILinksData,
  NodeResultItem,
  RelationshipState,
  nodeCts,
} from '../../utils/custom-interfaces/PluginTR';
import CustomNode from './NodesComponent/CustomNode';

// Import styles once
import 'reactflow/dist/style.css';
import '../../styles/custom-styles/overview.css';

// Import utils
import {
  generateNodes,
  isCustomSettingsFn,
  setPluginDataStoreFn,
  checkMissingOrExtraIds,
  checkNodesVsTablesIds,
  filterRelationshipLinks,
  filterNodesWithoutLinks,
  generateEdges,
  generateLinks,
  setViewportPluginDataStoreFn,
} from '../../utils/custom-utils/utils';

import { TableArray } from '../../utils/template-interfaces/Table.interface';
import {
  IPresetInfo,
  PresetCustomSettings,
} from '../../utils/template-interfaces/PluginPresets/Presets.interface';

// const nodeTypes = {
//   custom: CustomNode,
// };
// Plugin Table Relationships Component
const PluginTR: React.FC<IPluginTRProps> = ({
  appActiveState,
  allTables,
  pluginDataStore,
  activeRelationships,
}) => {
  const [_allTables, setAllTables] = useState<TableArray>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [links, setLinks] = useState<ILinksData[]>([]);
  const [nodesCts, setNodesCts] = useState<nodeCts[]>([]);
  const [relationship, setRelationship] = useState(activeRelationships);
  const [initialPosition, setInitialPosition] = useState<any>(null);
  const viewPortState = useViewport();
  const reactFlow = useReactFlow();

  const now = new Date();
  const time =
    now.toLocaleTimeString('en-US', { hour12: false }) +
    '.' +
    now.getMilliseconds().toString().padStart(3, '0');
  // console.log({ time });
  // console.log({ 0: allTables });
  // console.log({ time });
  const [_pluginVPDataStore, setPluginVPDataStore] = useState(viewPortState);
  let activeCustomSettings: PresetCustomSettings;
  // const someDependency: any[] = [];
  const nodeTypes = useMemo(
    () => ({
      custom: CustomNode,
    }),
    []
  );
  useEffect(() => {
    // console.log('activeRelationships');

    let _edges = edges;
    let _links = generateLinks(allTables);

    const pluginPresetData =
      pluginDataStore.presets[
        pluginDataStore.presets.findIndex(
          (preset: IPresetInfo) => preset._id === appActiveState.activePresetId
        )
      ];
    const cs = pluginPresetData?.customSettings;

    // Update relationship only if it has changed
    if (JSON.stringify(activeRelationships) !== JSON.stringify(relationship)) {
      setRelationship(activeRelationships);
    }

    // Filtering the links based on the active relationships
    const filteredLinks = filterRelationshipLinks(_links, activeRelationships);

    // Filtering the nodes based on the active relationships
    const nodesNoLinks =
      activeRelationships.tblNoLnk === false ? filterNodesWithoutLinks(nodes) : cs?.nodes;

    // Further filtering the nodes to remove any nodes without a type
    const validNodes =
      nodesNoLinks !== undefined
        ? (nodesNoLinks.filter((node: any) => node.type !== undefined) as NodeResultItem[])
        : [];

    _edges = generateEdges(filteredLinks, validNodes);

    // Only update links, nodes, and edges if they have changed
    if (JSON.stringify(filteredLinks) !== JSON.stringify(links)) {
      setLinks(filteredLinks);
    }

    if (JSON.stringify(validNodes) !== JSON.stringify(nodes)) {
      setNodes(validNodes);
    }

    if (JSON.stringify(_edges) !== JSON.stringify(edges)) {
      setEdges(_edges);
    }
  }, [activeRelationships, relationship]);

  useEffect(() => {
    // console.log('appActiveState.activePresetId');
    const pluginVPDataStore =
      pluginDataStore.presets[appActiveState.activePresetIdx].customSettings?.vp;
    if (pluginVPDataStore === undefined) {
      reactFlow.fitView();
    } else {
      reactFlow.setViewport(pluginVPDataStore);
    }
    setPluginVPDataStore(pluginVPDataStore);
  }, [appActiveState.activePresetId]);

  useEffect(() => {
    const allTablesNodes = generateNodes(allTables);
    // console.log({ allTablesNodes });
    const { isPDSCS, customSettings } = isCustomSettingsFn(
      pluginDataStore,
      allTables,
      appActiveState.activePresetId
    );

    activeCustomSettings = customSettings;
    if (isPDSCS === false) {
      // if custom settings are not found, we set nodes, links, edges and relationship
      const { links, nodes, edges, relationship } = activeCustomSettings;
      setStates(links, nodes, edges, relationship);
      setPluginDataStoreFn(pluginDataStore, appActiveState.activePresetId, nodes, links, edges);
    }

    // In any case and whenever there is a change in the Tables, we need to check if the nodes and tables are equal
    const storedNodesVsTablesNodes = activeCustomSettings.nodes.length === allTablesNodes.length;

    // If the nodes and tables are equal, we check if the ids and columns are equal
    //else we find which nodes are missing or extra
    const newCustomSettings = storedNodesVsTablesNodes
      ? checkNodesVsTablesIds(activeCustomSettings, allTablesNodes, allTables)
      : checkMissingOrExtraIds(activeCustomSettings, allTablesNodes, allTables);

    const { links, nodes, edges, relationship } = newCustomSettings as PresetCustomSettings;

    setStates(links, nodes, edges, relationship);
    setPluginDataStoreFn(pluginDataStore, appActiveState.activePresetId, nodes, links, edges);
  }, [JSON.stringify(allTables), appActiveState.activePresetId]);

  // This function sets the states of the nodes, links, edges and relationship in the ERD Plugin component
  function setStates(_links: any, _nodes: any, _edges: any, _relationship: RelationshipState) {
    // console.log('setStates');
    setLinks(_links);
    setNodes(_nodes);
    setEdges(_edges);
    setRelationship(_relationship);
    setPluginDataStoreFn(pluginDataStore, appActiveState.activePresetId, _nodes, _links, _edges);
  }

  const onNodeDragStart = useCallback((event: any, node: any) => {
    console.log('onNodeDragStart');
    setInitialPosition({ x: node.position.x, y: node.position.y });
  }, []);

  const onNodeDrag = useCallback(
    (event: any, node: any) => {
      console.log('onNodeDrag');
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
    [nodes, setNodes]
  );

  const onNodeDragStop = useCallback(
    (event: any, node: any) => {
      console.log('onNodeDragStop');

      // Check if the node dragged has an initial position
      if (initialPosition) {
        // Check if the position has changed
        const positionChanged =
          initialPosition.x !== node.position.x || initialPosition.y !== node.position.y;

        if (positionChanged) {
          // Update the node's position only if it has changed
          const updatedNodes = nodes.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  position: node.position, // Update to new position
                  data: {
                    ...n.data,
                    selected: false, // Deselect the node after drag stop
                  },
                }
              : n
          ) as NodeResultItem[];

          // Update the state and plugin data store
          setNodes(updatedNodes);
          setPluginDataStoreFn(
            pluginDataStore,
            appActiveState.activePresetId,
            updatedNodes,
            links,
            edges
          );
        }
      }

      // Reset the initial position after the drag stops
      setInitialPosition(null);
    },
    [
      nodes,
      pluginDataStore,
      activeRelationships,
      appActiveState.activePresetId,
      links,
      edges,
      initialPosition,
    ]
  );

  const proOptions = { hideAttribution: true };
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
        defaultViewport={_pluginVPDataStore}
        fitView={false}
        onNodeDragStop={onNodeDragStop}
        proOptions={proOptions}
        onMoveEnd={(e) => {
          setViewportPluginDataStoreFn(
            pluginDataStore,
            appActiveState.activePresetId,
            viewPortState
          );
        }}
        nodeTypes={nodeTypes}></ReactFlow>
    </>
  );
};

const areEqual = (prevProps: IPluginTRProps, nextProps: IPluginTRProps) => {
  return (
    prevProps.appActiveState.activePresetId === nextProps.appActiveState.activePresetId &&
    JSON.stringify(prevProps.allTables) === JSON.stringify(nextProps.allTables) &&
    prevProps.pluginDataStore === nextProps.pluginDataStore &&
    JSON.stringify(prevProps.activeRelationships) === JSON.stringify(nextProps.activeRelationships)
  );
};

export default memo(PluginTR, areEqual);
