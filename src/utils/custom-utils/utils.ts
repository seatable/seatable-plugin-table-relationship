import { LINK_TYPE } from '../custom-constants/constants';
import {
  ILinksColumnData,
  ILinksData,
  ISrcFrstTblId,
  IViewPort,
  NodeResultItem,
  RelationshipState,
  TableDisplayState,
} from '../custom-interfaces/PluginTR';
import { PLUGIN_NAME } from '../template-constants';
import { IPluginDataStore } from '../template-interfaces/App.interface';
import { PresetCustomSettings } from '../template-interfaces/PluginPresets/Presets.interface';
import { Table, TableArray, TableColumn } from '../template-interfaces/Table.interface';
import {
  SelectedViews,
  LinksStrokes,
  StrokeProperties,
} from '../../utils/custom-interfaces/PluginTR';
import { MarkerType, Edge, EdgeMarker } from 'reactflow';

// Set to true to scale node/column widths with font size (> 14px)
const SCALE_NODES_WITH_FONTSIZE = false;

export function nodeStyleForFontSize(fontSize: number) {
  const width = SCALE_NODES_WITH_FONTSIZE && fontSize > 14 ? 180 * (1 + (fontSize - 14) / 28) : 180;
  return { fontSize: fontSize + 'px', width: width + 'px' };
}

// Read the latest preset data from the SDK (source of truth), falling back to React state.
// pluginDataStore React state can be stale because setPluginDataStoreFn writes to the SDK
// without updating React state.
export function getFreshPresetData(PDS: IPluginDataStore, activePresetId: string) {
  const freshPDS = window.dtableSDK?.getPluginSettings(PLUGIN_NAME) || PDS;
  const preset = freshPDS.presets.find((preset: any) => preset._id === activePresetId);
  // Deep copy to prevent shared references between SDK internal storage and our objects.
  // Without this, in-place mutations (e.g. arrangeNodesOnGrid) corrupt the SDK's stored data.
  return preset ? JSON.parse(JSON.stringify(preset)) : preset;
}

// Helper for Checking Data
export function isCustomSettingsFn(
  PDS: IPluginDataStore,
  allTables: TableArray,
  activePresetId: string
) {
  const activePresetCustomSettings = getFreshPresetData(PDS, activePresetId)?.customSettings;
  if (
    activePresetCustomSettings === undefined ||
    Object.keys(activePresetCustomSettings).length === 0
  ) {
    const defaultActivePresetCustomSettings = generateDefaultCustomSettings(allTables);
    return { isPDSCS: false, customSettings: defaultActivePresetCustomSettings };
  } else {
    return { isPDSCS: true, customSettings: activePresetCustomSettings };
  }
}

export function generateDefaultCustomSettings(allTables: TableArray) {
  let defaultActivePresetCustomSettings: PresetCustomSettings;
  const selectedViews = Object.assign(
    {},
    ...allTables.map((t) => ({ [t._id]: t.views.filter((v) => v.type === 'table')[0]._id }))
  );
  const headerColor = '#ED7109';
  const fontSize = 14;
  const edgeStrokes = {
    link: {
      stroke: '#212529',
      strokeWidth: 1,
      strokeDasharray: '0',
    },
    formula: {
      stroke: '#212529',
      strokeWidth: 1,
      strokeDasharray: '5 5',
    },
    formula2nd: {
      stroke: '#212529',
      strokeWidth: 1,
      strokeDasharray: '1 5',
    },
  };
  let lnk = generateLinks(allTables, selectedViews, true);
  let ns = generateNodes(
    allTables,
    allTables.map((t) => {
      return t._id;
    }),
    selectedViews,
    true,
    true,
    true,
    headerColor,
    fontSize
  );

  const numCols = 5;
  ns = arrangeNodesOnGrid(ns, lnk, fontSize, numCols);
  const es = generateEdges(lnk, ns, edgeStrokes);
  defaultActivePresetCustomSettings = {
    relationship: {
      recRel: true,
      recSelfRel: true,
      lkRel: true,
      lk2Rel: true,
      countLinks: true,
      rollup: true,
      findmax: true,
      findmin: true,
    },
    tableDisplay: {
      isAllShown: true,
      displayedTables: allTables.map(function (t) {
        return t._id;
      }),
      selectedViews: selectedViews,
      headerColor: headerColor,
      fontSize: fontSize,
      backgroundColor: '#F5F5F5',
      edgeStrokes: edgeStrokes,
      isBackground: false,
      tblNoLnk: true,
      tblAllCols: true,
      numCols: numCols,
    },
    links: lnk,
    nodes: ns,
    edges: es,
  };
  return defaultActivePresetCustomSettings;
}

export function checkNodesVsTablesIds(
  customSettings: PresetCustomSettings,
  allTablesNodes: NodeResultItem[],
  allTables: TableArray
) {
  const textNodes = customSettings?.nodes.filter((n: NodeResultItem) => n.type === 'textnode');
  const tableNodes = customSettings?.nodes.filter((n: NodeResultItem) => n.type !== 'textnode');

  const customNodesIds = tableNodes.map((node: NodeResultItem) => node.id);
  const allTablesIds = allTablesNodes.map((node) => node.id);
  const nodesVsTablesIds = customNodesIds.every((id: string) => allTablesIds.includes(id));
  //if (nodesVsTablesIds) {
  // Even though the ids are the same, we need to check if the columns are equal
  const updatedCustomSettings = checkIfColumnsAreEqual(customSettings, allTablesNodes, allTables);
  let updatedCustomSettingsWithNodesAndColName = checkNodesData(
    updatedCustomSettings,
    allTablesNodes
  );
  updatedCustomSettingsWithNodesAndColName.nodes = [
    ...updatedCustomSettingsWithNodesAndColName.nodes,
    ...textNodes,
  ];
  return updatedCustomSettingsWithNodesAndColName;
  //}
}

export function checkIfColumnsAreEqual(
  customSettings: PresetCustomSettings,
  allTablesNodes: NodeResultItem[],
  allTables: TableArray
) {
  // const customNodes = customSettings.nodes;
  let nodes = allTablesNodes;
  // const _nodes: NodeResultItem[] = [...customNodes];
  const textNodes = customSettings.nodes.filter((n: NodeResultItem) => n.type === 'textnode');
  const tableNodes = customSettings.nodes.filter((n: NodeResultItem) => n.type !== 'textnode');

  // let newNodes = checkColumnsPosition(nodes, _nodes);

  let _links = generateLinks(
    allTables,
    customSettings.tableDisplay.selectedViews,
    customSettings.tableDisplay.tblAllCols
  );
  nodes = arrangeNodesOnGrid(
    nodes,
    _links,
    customSettings.tableDisplay.fontSize,
    customSettings.tableDisplay.numCols ?? 5
  );
  let newNodes = checkData(nodes, tableNodes); //checkColumnsPosition(nodes, _nodes);
  const _es = generateEdges(_links, newNodes, customSettings.tableDisplay.edgeStrokes);
  newNodes = [...newNodes, ...textNodes];
  return { ...customSettings, links: _links, edges: _es, nodes: newNodes };
}

export function checkMissingOrExtraIds(
  customSettings: PresetCustomSettings,
  allTablesNodes: NodeResultItem[],
  allTables: TableArray
) {
  const textNodes = customSettings.nodes.filter((n: NodeResultItem) => n.type === 'textnode');
  const tableNodes = customSettings.nodes.filter((n: NodeResultItem) => n.type !== 'textnode');
  // First we need to get the ids of the nodes in the customSettings and allTables
  const customNodesIds = tableNodes.map((node: NodeResultItem) => node.id);
  const allTablesIds = allTablesNodes.map((node) => node.id);
  const missingIds = allTablesIds.filter((id) => !customNodesIds.includes(id));
  const extraIds = customNodesIds.filter((id: string) => !allTablesIds.includes(id));
  let _nodes: NodeResultItem[] = [...tableNodes];
  // Add missing nodes to customSettings.nodes
  missingIds.forEach((missingId: string) => {
    const nodeToAdd = allTablesNodes.find((node) => node.id === missingId);
    if (nodeToAdd) _nodes.push(nodeToAdd);
  });

  // Remove extra nodes from customSettings.nodes
  extraIds.forEach((extraId: string) => {
    const nodeIndex = _nodes.findIndex((node: NodeResultItem) => node.id === extraId);
    if (nodeIndex !== -1) _nodes.splice(nodeIndex, 1);
  });

  _nodes = [..._nodes, ...textNodes];

  let _links = generateLinks(
    allTables,
    customSettings.tableDisplay.selectedViews,
    customSettings.tableDisplay.tblAllCols
  );
  const _es = generateEdges(_links, _nodes, customSettings.tableDisplay.edgeStrokes);
  return { ...customSettings, links: _links, edges: _es, nodes: _nodes };
}

export function checkNodesData(
  customSettings: PresetCustomSettings,
  allTablesNodes: NodeResultItem[]
): PresetCustomSettings {
  const nodesMap = new Map<string, NodeResultItem>(allTablesNodes.map((node) => [node.id, node]));

  const _nodes: NodeResultItem[] = [...customSettings.nodes];

  for (let i = 0; i < _nodes.length; i++) {
    const currentNode = _nodes[i];
    const correspondingNode = nodesMap.get(currentNode.id);

    if (correspondingNode) {
      /*currentNode.hidden = currentNode.hidden !== correspondingNode.hidden
          ? correspondingNode.hidden
          : currentNode.hidden;*/

      currentNode.data.headerColor =
        currentNode.data.headerColor !== correspondingNode.data.headerColor
          ? correspondingNode.data.headerColor
          : currentNode.data.headerColor;

      if (!currentNode.style) {
        currentNode.style = {};
      }
      currentNode.style.fontSize =
        currentNode.style?.fontSize !== correspondingNode.style?.fontSize
          ? correspondingNode.style.fontSize
          : currentNode.style.fontSize;
      /*currentNode.data.fontSize =
        currentNode.style?.fontSize !== correspondingNode.style?.fontSize
          ? parseInt(correspondingNode.style.fontSize!)
          : parseInt(currentNode.style.fontSize!);*/

      currentNode.data.name =
        currentNode.data.name !== correspondingNode.data.name
          ? correspondingNode.data.name
          : currentNode.data.name;

      currentNode.data.columns = correspondingNode.data.columns;
      currentNode.data.hasHiddenLinks = correspondingNode.data.hasHiddenLinks;

      /*currentNode.data.position =
        currentNode.data.position == correspondingNode.data.position
          ? correspondingNode.data.position
          : currentNode.data.position;*/

      currentNode.position =
        currentNode.position === correspondingNode.position
          ? correspondingNode.position
          : currentNode.position;
    }
  }

  const updatedCustomSettings = {
    ...customSettings,
    nodes: _nodes,
  };

  return updatedCustomSettings;
}

function checkData(array1: NodeResultItem[], array2: NodeResultItem[]): NodeResultItem[] {
  // Create a new array to store the merged results
  const mergedArray: NodeResultItem[] = [];

  for (let i = 0; i < array1.length; i++) {
    const item1 = array1[i];
    const item2 = array2.find((item) => item.id === item1.id);

    if (item2) {
      // Compare and merge data and position
      const data =
        JSON.stringify(item1.data) !== JSON.stringify(item2.data) ? item1.data : item2.data;

      const position =
        JSON.stringify(item1.position) !== JSON.stringify(item2.position)
          ? item1.position
          : item2.position;

      // Create merged item.
      // `hidden` must come from the fresh node (item1): it's a computed value
      // derived from current link presence, displayedTables, tblNoLnk, isAllShown.
      // Spreading item2 alone would keep the stale `hidden` — so a table that
      // gained its first link column would stay hidden when tblNoLnk is off.
      const mergedItem: NodeResultItem = {
        ...item2,
        hidden: item1.hidden,
        position: position,
        data: data,
      };

      mergedArray.push(mergedItem);
    }
  }

  return mergedArray;
}

// This function is used to update the customSettings in the PluginDataStore
export function setPluginDataStoreFn(
  pluginDataStore: IPluginDataStore,
  activeRelationships: RelationshipState,
  activeTableDisplay: TableDisplayState,
  activePresetId: string,
  ns: any[],
  lnk: ILinksData[]
  // es: Edge[]
) {
  // Read the latest persisted data instead of using the (possibly stale) closure value.
  // This prevents saving preset B from reverting preset A's data to a stale snapshot.
  const currentData = window.dtableSDK.getPluginSettings(PLUGIN_NAME) || pluginDataStore;
  window.dtableSDK.updatePluginSettings(PLUGIN_NAME, {
    ...currentData,
    presets: currentData.presets.map((preset: any) => {
      if (preset._id === activePresetId) {
        return {
          ...preset,
          customSettings: {
            ...preset.customSettings,
            nodes: ns,
            links: lnk,
            // edges: es,
            relationship: activeRelationships,
            tableDisplay: activeTableDisplay,
          },
        };
      }
      return preset;
    }),
  });
}

export function setViewportPluginDataStoreFn(
  pluginDataStore: IPluginDataStore,
  activePresetId: string,
  vp: IViewPort
) {
  const currentData = window.dtableSDK.getPluginSettings(PLUGIN_NAME) || pluginDataStore;
  window.dtableSDK.updatePluginSettings(PLUGIN_NAME, {
    ...currentData,
    presets: currentData.presets.map((preset: any) => {
      if (preset._id === activePresetId) {
        return {
          ...preset,
          customSettings: {
            ...preset.customSettings,
            vp: vp,
          },
        };
      }
      return preset;
    }),
  });
}

function extractColumnNames(input: string): string[] {
  const regex = /\{([^}.]+)\./g;
  const matches: string[] = [];
  let match;

  while ((match = regex.exec(input)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}

export function generateLinks(
  tables: TableArray,
  selectedViews: SelectedViews,
  tblAllCols: boolean
): ILinksData[] {
  const formulaCc: TableColumn[] = []; // Column 'link' type
  const linkCc: ILinksColumnData[] = []; // Column 'link-formula' type

  tables.forEach((t) => {
    findColumns(t, selectedViews, tblAllCols).forEach((c, idx) => {
      //t.columns
      if (c.type === LINK_TYPE.link) {
        linkCc.push({
          table_id: t._id,
          table_name: t.name,
          column_key: c.key,
          column_name: c.name,
          column_idx: idx,
          srcT: c.data.table_id,
          tgtT: c.data.other_table_id,
          link_id: c.data.link_id,
          isMultiple: c.data.is_multiple,
        });
      } else if (c.type === LINK_TYPE.lnkformula) {
        formulaCc.push(c);
      } else if (c.type === LINK_TYPE.formula) {
        let linked = false;
        const columnNames = extractColumnNames(c.data.formula);
        if (columnNames) {
          columnNames.forEach((colName) => {
            let column = t.columns.filter((col) => col.name === colName);
            if (column && column.length === 1 && column[0].type === LINK_TYPE.link) {
              linked = true;
            }
          });
        }
        /*if (linked) {
          console.log(`Table "${t.name}" - Column "${c.name}" => ${LINK_TYPE.formula}`);
          // TODO : deal with this case!
        }*/
      }
    });
  });

  const lCcData: ILinksData[] = reduceLinkCcData(linkCc); // Column 'link' Data for Link
  const fCcData: ILinksData[] = createFormulaCcData(formulaCc, tables, selectedViews, tblAllCols); // Column 'link-formula' Data for Link

  return [...lCcData, ...fCcData];
}

export function filterRelationshipLinks(lnk: ILinksData[], relationship: RelationshipState) {
  if (!relationship.recRel) {
    lnk = lnk.filter(
      (obj) => obj.type !== LINK_TYPE.link || obj.sourceData.table_id === obj.targetData1st.table_id
    );
  }
  if (!relationship.recSelfRel) {
    lnk = lnk.filter(
      (obj) => obj.type !== LINK_TYPE.link || obj.sourceData.table_id !== obj.targetData1st.table_id
    );
  }
  if (!relationship.lkRel) {
    lnk = lnk.filter((obj) => obj.formulaType !== LINK_TYPE.lookup);
  }
  if (!relationship.countLinks) {
    lnk = lnk.filter((obj) => obj.formulaType !== LINK_TYPE.countLinks);
  }
  if (!relationship.rollup) {
    lnk = lnk.filter((obj) => obj.formulaType !== LINK_TYPE.rollup);
  }
  if (!relationship.findmax) {
    lnk = lnk.filter((obj) => obj.formulaType !== LINK_TYPE.findmax);
  }
  if (!relationship.findmin) {
    lnk = lnk.filter((obj) => obj.formulaType !== LINK_TYPE.findmin);
  }
  return lnk;
}

export function filterTablesWithLinks(table: TableArray) {
  return table.filter((t) => t.columns.some((c: any) => c.type === LINK_TYPE.link));
}

export function filterTablesWithoutLinks(table: TableArray) {
  return table.filter((t) => !t.columns.some((c: any) => c.type === LINK_TYPE.link));
}

export function updateNodesData(
  tables: TableArray,
  //displayedTables: Array<string>,
  selectedViews: SelectedViews,
  //isAllShown: boolean,
  //tblNoLnk: boolean,
  tblAllCols: boolean,
  //headerColor: string,
  //fontSize: number,
  nodes: any[] = []
): NodeResultItem[] {
  const ns: NodeResultItem[] = [];

  const tablesList = tables
    .slice()
    .sort((t1, t2) => compareColumnsNumber(t1, t2, selectedViews, tblAllCols));

  const textNodes = nodes.filter((n: NodeResultItem) => n.type === 'textnode');
  const tableNodes = nodes.filter((n: NodeResultItem) => n.type !== 'textnode');

  let _nodes = tableNodes
    ?.filter((n) => {
      return tablesList.some((t: any) => t._id === n.id);
    })
    .map((n) => {
      const table = tablesList.filter((t: any) => t._id === n.id)[0];
      const info = findColumns(table, selectedViews, tblAllCols).map((cl) => ({
        key: cl.key,
        type: cl.type,
        name: cl.name,
        isMultiple: cl.data === undefined || cl.data === null ? false : cl.data.is_multiple,
      }));
      const tableHasLinks = table?.columns.some((c: any) => c.type === LINK_TYPE.link);
      const visibleHasLinks = info.some((c: any) => c.type === LINK_TYPE.link);
      return {
        ...n,
        data: {
          ...n.data,
          name: table.name.toString(),
          columns: info,
          hasHiddenLinks: tableHasLinks && !visibleHasLinks,
        },
      };
    });
  _nodes = [..._nodes, ...textNodes];
  return _nodes;
}

export function filterNotDisplayedNodes(nodes: any[], tableDisplay: TableDisplayState) {
  return nodes?.map((n) => {
    if (n.type === 'textnode') return { ...n, hidden: false };
    // Use hasHiddenLinks OR visible link columns to determine if table has links.
    // A table with link columns hidden by the view should still count as "having links".
    const hasLinks =
      n.data.hasHiddenLinks || n.data.columns.some((c: any) => c.type === LINK_TYPE.link);
    return {
      ...n,
      hidden: tableDisplay.isAllShown
        ? tableDisplay.tblNoLnk
          ? !tableDisplay.displayedTables.includes(n.id)
          : !hasLinks || !tableDisplay.displayedTables.includes(n.id)
        : !tableDisplay.displayedTables.includes(n.id),
    };
  });
}

function compareColumnsNumber(
  t1: Table,
  t2: Table,
  selectedViews: SelectedViews,
  tblAllCols: boolean
) {
  const t1NumCol = findColumns(t1, selectedViews, tblAllCols).length;
  const t2NumCol = findColumns(t2, selectedViews, tblAllCols).length;
  if (t1NumCol < t2NumCol) return -1;
  if (t1NumCol > t2NumCol) return 1;
  return 0;
}

export function generateNodes(
  tables: TableArray,
  displayedTables: Array<string>,
  selectedViews: SelectedViews,
  isAllShown: boolean,
  tblNoLnk: boolean,
  tblAllCols: boolean,
  headerColor: string,
  fontSize: number,
  nodes: any[] = []
): NodeResultItem[] {
  const numRows: number = 5;
  const numCols: number = 5;

  const ns: NodeResultItem[] = [];

  const tablesList = tables
    .slice()
    .sort((t1, t2) => compareColumnsNumber(t1, t2, selectedViews, tblAllCols));

  for (let i = 0; i < tablesList.length; i++) {
    const table = tablesList[i];
    if (!table.columns) {
      continue;
    }
    const info = findColumns(table, selectedViews, tblAllCols).map((cl) => ({
      key: cl.key,
      type: cl.type,
      name: cl.name,
      isMultiple: cl.data === undefined || cl.data === null ? false : cl.data.is_multiple,
    }));

    // Calculate position
    const rowIndex = Math.floor(i / numCols);
    const colIndex = i % numCols;
    const x = 100 + colIndex * 250;
    const y = 100 + rowIndex * 250;

    let position: { x: number; y: number };
    let displaced = false;

    if (nodes) {
      let _node = nodes.filter((n) => n.id === table._id.toString());
      position = _node && _node.length === 1 ? _node[0].position : { x, y };
      displaced = _node && _node.length === 1 ? _node[0].data.displaced || false : false;
    } else {
      position = { x, y };
      displaced = false;
    }

    // Check actual table columns for links (not just view-visible ones)
    const tableHasLinks = table.columns.some((c: any) => c.type === LINK_TYPE.link);
    const visibleHasLinks = info.some((c: any) => c.type === LINK_TYPE.link);

    const activeNode: NodeResultItem = {
      id: table._id.toString(),
      type: 'custom',
      position: position,
      hidden: isAllShown
        ? tblNoLnk
          ? !displayedTables.includes(table._id.toString())
          : !tableHasLinks || !displayedTables.includes(table._id.toString())
        : true,
      data: {
        name: table.name.toString(),
        columns: info,
        //position: { x, y },
        headerColor: headerColor,
        fontSize: fontSize,
        displaced: displaced,
        hasHiddenLinks: tableHasLinks && !visibleHasLinks,
      },
      style: {
        ...nodeStyleForFontSize(fontSize),
      },
    };

    ns.push(activeNode);
  }
  return ns;
}

export function arrangeNodesOnGrid(
  nodes: NodeResultItem[],
  links: ILinksData[],
  fontSize: number,
  numCols: number = 5
): NodeResultItem[] {
  const gridPositions = optimizeNodePositions(nodes, links, numCols);
  if (!nodes || nodes.length === 0) {
    return nodes;
  }

  // Compute row y-offsets up to the highest row actually used. Previously hardcoded
  // to 5 rows, which left rowHeights[5+] undefined and produced NaN y-positions on
  // bases with enough tables to spill past row 4.
  let maxRow = 0;
  Array.from(gridPositions.values()).forEach((p) => {
    if (p.row > maxRow) maxRow = p.row;
  });

  const gap = 30;
  const rowHeights: number[] = [0];
  for (let r = 0; r < maxRow; r++) {
    const rowNodes = nodes.filter((n) => gridPositions.get(n.id)?.row === r);
    // Use actual measured height from ReactFlow when available, fall back to generous estimate
    const tallestHeight =
      rowNodes.length > 0
        ? Math.max(
            ...rowNodes.map((n) => {
              if (n.height && n.height > 0) return n.height;
              // Generous estimate accounting for line-height (~1.5x), padding, header, body
              const cols = n.data.columns?.length || 0;
              return 50 + fontSize * 1.5 + cols * (fontSize * 1.5 + 3);
            })
          )
        : 0;
    rowHeights.push(rowHeights[rowHeights.length - 1] + tallestHeight + gap);
  }

  const colWidth =
    SCALE_NODES_WITH_FONTSIZE && fontSize > 14 ? 250 * (1 + (fontSize - 14) / 28) : 250;

  for (let i = 0; i < nodes.length; i++) {
    const gridPos = gridPositions.get(nodes[i].id);
    if (gridPos && !nodes[i].data.displaced) {
      nodes[i].position.x = 100 + gridPos.col * colWidth;
      nodes[i].position.y = 100 + (rowHeights[gridPos.row] ?? 0);
    }
  }
  return nodes;
}

export function optimizeNodePositions(
  nodes: NodeResultItem[],
  links: ILinksData[],
  cols: number = 5
): Map<string, { nodeName: string; row: number; col: number }> {
  if (nodes.length === 0) return new Map();

  const adjacencyMap = buildAdjacencyMap(nodes, links);
  let positions = placeWithCenteredConnections(nodes, adjacencyMap, cols);
  positions = optimizePairs(positions, adjacencyMap, cols);
  return positions;
}

function placeWithCenteredConnections(
  nodes: NodeResultItem[],
  adjacencyMap: Map<string, Set<string>>,
  cols: number
): Map<string, { nodeName: string; row: number; col: number }> {
  const positions = new Map<string, { nodeName: string; row: number; col: number }>();
  const placed = new Set<string>();

  const connectedNodes = nodes.filter((n) => {
    const conns = adjacencyMap.get(n.id);
    return conns && conns.size > 0;
  });

  const isolatedNodes = nodes.filter((n) => {
    const conns = adjacencyMap.get(n.id);
    return !conns || conns.size === 0;
  });

  connectedNodes.sort((a, b) => {
    const aConns = adjacencyMap.get(a.id)?.size || 0;
    const bConns = adjacencyMap.get(b.id)?.size || 0;
    return bConns - aConns;
  });

  let currentRow = 0;
  let currentCol = 0;

  connectedNodes.forEach((node) => {
    if (placed.has(node.id)) return;

    const neighbors = Array.from(adjacencyMap.get(node.id) || []).filter((n) => n !== node.id);
    const unplacedNeighbors = neighbors.filter((id) => !placed.has(id));

    const groupSize = 1 + unplacedNeighbors.length;

    // Group too wide for the row: place this hub sequentially and let its neighbors
    // be placed in their own outer-loop iteration. The previous code centered the hub
    // and split neighbors left/right, but bounded both leftCol >= groupStart and
    // rightCol < cols, so excess neighbors were silently dropped from `positions` and
    // ended up overlapping at their initial generateNodes coordinates.
    if (groupSize > cols) {
      if (currentCol >= cols) {
        currentCol = 0;
        currentRow++;
      }
      positions.set(node.id, { nodeName: node.data.name, row: currentRow, col: currentCol });
      placed.add(node.id);
      currentCol++;
      if (currentCol >= cols) {
        currentCol = 0;
        currentRow++;
      }
      return;
    }

    if (currentCol + groupSize > cols) {
      currentCol = 0;
      currentRow++;
    }

    const groupStart = currentCol;
    const centerCol = groupStart + Math.floor(unplacedNeighbors.length / 2);
    if (node.id) {
      positions.set(node.id, { nodeName: node.data.name, row: currentRow, col: centerCol });
      placed.add(node.id);
    }

    let leftCol = centerCol - 1;
    let rightCol = centerCol + 1;
    let useLeft = true;

    unplacedNeighbors.forEach((neighborId) => {
      if (useLeft && leftCol >= groupStart) {
        if (neighborId) {
          positions.set(neighborId, {
            nodeName: nodes.filter((n) => n.id === neighborId)[0]?.data.name,
            row: currentRow,
            col: leftCol,
          });
          placed.add(neighborId);
          leftCol--;
        }
      } else if (rightCol < groupStart + groupSize && rightCol < cols) {
        if (neighborId) {
          positions.set(neighborId, {
            nodeName: nodes.filter((n) => n.id === neighborId)[0]?.data.name,
            row: currentRow,
            col: rightCol,
          });
          placed.add(neighborId);
          rightCol++;
        }
      }
      useLeft = !useLeft;
    });

    currentCol = groupStart + groupSize;

    if (currentCol >= cols) {
      currentCol = 0;
      currentRow++;
    }
  });

  isolatedNodes.forEach((node) => {
    if (node.id) {
      positions.set(node.id, { nodeName: node.data.name, row: currentRow, col: currentCol });
      placed.add(node.id);
      currentCol++;
    }

    if (currentCol >= cols) {
      currentCol = 0;
      currentRow++;
    }
  });
  return positions;
}

function buildAdjacencyMap(nodes: NodeResultItem[], links: ILinksData[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  if (!links || !nodes) {
    return map;
  }

  nodes.forEach((node) => map.set(node.id, new Set()));

  links.forEach((link) => {
    const sourceId = link.sourceData.table_id;
    const targetId = link.targetData1st.table_id;

    if (map.has(sourceId)) map.get(sourceId)!.add(targetId);
    if (map.has(targetId)) map.get(targetId)!.add(sourceId);

    if (link.targetData2nd) {
      const target2Id = link.targetData2nd.table_id;
      if (map.has(sourceId)) map.get(sourceId)!.add(target2Id);
      if (map.has(target2Id)) map.get(target2Id)!.add(sourceId);
    }
  });

  return map;
}

function optimizePairs(
  positions: Map<string, { nodeName: string; row: number; col: number }>,
  adjacencyMap: Map<string, Set<string>>,
  cols: number
): Map<string, { nodeName: string; row: number; col: number }> {
  const newPositions = new Map(positions);
  const occupiedRows: number[] = [];
  const positionsArray = Array.from(newPositions.entries());

  for (let i = 0; i < positionsArray.length; i++) {
    const [nodeId, pos] = positionsArray[i];
    const neighbors = adjacencyMap.get(nodeId);

    if (occupiedRows.indexOf(pos.row) === -1) {
      occupiedRows.push(pos.row);
    }

    if (!neighbors || neighbors.size !== 1) continue;

    const neighborId = Array.from(neighbors)[0];
    if (!neighborId) continue;
    const neighborNeighbors = adjacencyMap.get(neighborId);
    if (!neighborNeighbors) continue;
    const realNeighbors = new Set(Array.from(neighborNeighbors!).filter((n) => n !== nodeId));

    if (!realNeighbors || realNeighbors.size !== 1) continue;

    const neighborPos = newPositions.get(neighborId);
    if (!neighborPos) continue;

    if (pos.row === neighborPos.row) {
      const colDiff = Math.abs(pos.col - neighborPos.col);

      if (colDiff > 1) {
        const leftCol = Math.min(pos.col, neighborPos.col);
        const rightCol = Math.max(pos.col, neighborPos.col);

        let canMoveAdjacent = true;

        for (let j = 0; j < positionsArray.length; j++) {
          const [otherId, otherPos] = positionsArray[j];
          if (otherId === nodeId || otherId === neighborId) continue;

          if (otherPos.row === pos.row && otherPos.col === leftCol + 1) {
            canMoveAdjacent = false;
            break;
          }
        }
        if (canMoveAdjacent) {
          if (pos.col < neighborPos.col) {
            newPositions.set(neighborId, {
              nodeName: pos.nodeName,
              row: neighborPos.row,
              col: pos.col + 1,
            });
          } else {
            newPositions.set(neighborId, {
              nodeName: pos.nodeName,
              row: neighborPos.row,
              col: pos.col - 1,
            });
          }
        }
      }
    }
  }

  if (occupiedRows.indexOf(0) === -1) {
    for (let i = 0; i < positionsArray.length; i++) {
      const [nodeId, pos] = positionsArray[i];
      newPositions.set(nodeId, {
        ...pos,
        row: pos.row - 1,
      });
    }
  }

  return newPositions;
}

export function generateEdges(
  links: ILinksData[],
  ns: NodeResultItem[],
  edgeStrokes: LinksStrokes
): Edge[] {
  const es: Edge[] = [];
  let sourceHandle = '';
  let targetHandle = '';

  if (!links || !ns) {
    return es;
  }

  links.forEach((link, index) => {
    const { sourceData, targetData1st, type } = link;
    if (sourceData === null || targetData1st === null) {
      return;
    }
    const sourceTbl = sourceData.table_id;
    const targetTbl = targetData1st.table_id;
    const pointSameTable = sourceTbl === targetTbl;
    const sourceNode = ns.find((n) => n.id === sourceTbl && !n.hidden);
    const targetNode = ns.find((n) => n.id === targetTbl && !n.hidden);

    let lineStyle: StrokeProperties;

    if (!edgeStrokes) {
      edgeStrokes = {
        link: {
          stroke: '#212529',
          strokeWidth: 1,
          strokeDasharray: '0',
        },
        formula: {
          stroke: '#212529',
          strokeWidth: 1,
          strokeDasharray: '5 5',
        },
        formula2nd: {
          stroke: '#212529',
          strokeWidth: 1,
          strokeDasharray: '1 5',
        },
      };
    }

    switch (type) {
      case LINK_TYPE.link:
        lineStyle = { ...edgeStrokes.link };
        break;
      case LINK_TYPE.lnkformula:
        lineStyle = { ...edgeStrokes.formula };
        break;
      case LINK_TYPE.lnkformula2nd:
        lineStyle = { ...edgeStrokes.formula2nd };
        break;
      default:
        lineStyle = { ...edgeStrokes.link };
        break;
    }
    if (typeof lineStyle.strokeDasharray == 'object') {
      let arr = lineStyle.strokeDasharray as string[];
      lineStyle.strokeDasharray = arr.join(' ');
    }
    if (
      lineStyle.strokeDasharray &&
      lineStyle.strokeDasharray.length > 1 &&
      lineStyle.strokeDasharray.split(' ')[0] !== lineStyle.strokeDasharray.split(' ')[1]
    ) {
      lineStyle.strokeDasharray =
        lineStyle.strokeWidth.toString() + ' ' + (2 * lineStyle.strokeWidth + 1).toString();
    } else if (lineStyle.strokeDasharray.length > 1) {
      lineStyle.strokeDasharray =
        (2 * lineStyle.strokeWidth + 1).toString() +
        ' ' +
        (2 * lineStyle.strokeWidth + 1).toString();
    }

    if (sourceNode && targetNode) {
      let src = {
        tId: sourceNode.id,
        cId: sourceData.column_key,
        edgSide: sourceNode.position.x > targetNode.position.x ? 'l' : 'r',
        suffix: '-src',
      };
      let tgt = {
        tId: targetNode.id,
        cId: targetData1st.column_key,
        edgSide: sourceNode.position.x < targetNode.position.x ? 'l' : 'r',
        suffix: '-tgt',
      };

      //console.log('src', src);
      //console.log('tgt', tgt);

      // show self-linkage other side:
      if (tgt.cId === tgt.tId) {
        tgt.edgSide = 'l';
        src.edgSide = 'l';
      }

      sourceHandle = `${src.tId}_${src.cId}_${src.edgSide}${src.suffix}`;
      targetHandle = `${tgt.tId}_${tgt.cId}_${tgt.edgSide}${tgt.suffix}`;
    }

    const markerType: EdgeMarker = {
      type: MarkerType.ArrowClosed,
      width: 30 / lineStyle.strokeWidth,
      height: 30 / lineStyle.strokeWidth,
      color: '#212529',
    };

    if (sourceTbl && targetTbl && sourceHandle && targetHandle) {
      es.push({
        id: String(es.length),
        source: sourceTbl,
        target: targetTbl,
        sourceHandle: sourceHandle,
        targetHandle: targetHandle,
        type: !pointSameTable ? 'horizontalTangent' : 'smoothstep',
        updatable: true,
        style: {
          strokeWidth: lineStyle.strokeWidth,
          stroke: lineStyle.stroke,
          strokeDasharray: lineStyle.strokeDasharray,
        },
        markerStart: type === LINK_TYPE.link ? markerType : '',
        markerEnd: type === LINK_TYPE.link ? markerType : '',
      });
    }
  });
  return es;
}

// Helper for generateLinks

function findColumns(table: Table, selectedViews: SelectedViews, tblAllCols: boolean) {
  let selectedColumns: TableColumn[] = [];
  if (tblAllCols) {
    selectedColumns = table.columns;
  } else {
    let selectedView = table.views.filter((v) => v._id === selectedViews[table._id]);
    if (selectedView && selectedView.length === 1) {
      const hiddenColumns = selectedView[0].hidden_columns || [];
      selectedColumns = table.columns.filter((c) => !hiddenColumns.includes(c.key));
    }
  }
  return selectedColumns;
}
// Finding the data for the source and target of the link
function findData(
  formulaTye: string,
  tableKey: string,
  columnKey: string,
  allTables: TableArray,
  selectedViews: SelectedViews,
  tblAllCols: boolean,
  sourceTarget?: string
) {
  let result: ILinksColumnData = {
    column_key: '',
    column_name: '',
    column_idx: -1,
    table_id: '',
    table_name: '',
    isMultiple: true,
  };
  allTables.forEach((t) => {
    if (t._id === tableKey) {
      findColumns(t, selectedViews, tblAllCols).forEach((c: TableColumn, idx: number) => {
        //t?.columns.forEach((c: TableColumn) => {
        if (c.key === columnKey) {
          result = {
            column_key: c.key,
            column_name: c.name,
            column_idx: idx,
            table_id: t._id,
            table_name: t.name,
            isMultiple: c.type === LINK_TYPE.link ? c.data.is_multiple : false,
          };
        }
      });
    }
  });

  return result;
}

function findSourceAndFirstLinkedTableId(
  key: string,
  allTables: TableArray,
  selectedViews: SelectedViews,
  tblAllCols: boolean
) {
  let result: ISrcFrstTblId = { firstLinkTableId: '', sourceTableId: '' };
  allTables.forEach((t) => {
    findColumns(t, selectedViews, tblAllCols).forEach((c: TableColumn) => {
      //t.columns.forEach((c) => {
      if (c.key === key && c.type === LINK_TYPE.link) {
        result = {
          firstLinkTableId:
            c.data.other_table_id === t._id ? c.data.table_id : c.data.other_table_id,
          sourceTableId: c.data.table_id === t._id ? c.data.table_id : c.data.other_table_id,
        };
      }
    });
  });

  return result;
}

function findSecondLinkedTableId(
  tableKey: string,
  columnKey: string,
  allTables: TableArray,
  selectedViews: SelectedViews,
  tblAllCols: boolean
) {
  let targetColumns: TableColumn[] = [];
  let result: string = '';
  let tId = '';
  allTables.forEach((t) => {
    if (t._id === tableKey) {
      tId = t._id;
      targetColumns = findColumns(t, selectedViews, tblAllCols); //t.columns;
    }
  });

  targetColumns?.forEach((c: TableColumn) => {
    if (c.key === columnKey && c.type === LINK_TYPE.link) {
      result = c.data.other_table_id === tId ? c.data.table_id : c.data.other_table_id;
    }
  });

  return result;
}

function reduceLinkCcData(linkCc: ILinksColumnData[]) {
  const groupedItems: {
    [key: string]: { sourceData: ILinksColumnData | null; targetData: ILinksColumnData | null };
  } = {};
  linkCc.forEach((item) => {
    // create groupedItem element with sourceData and targetData: null
    if (item.link_id && !groupedItems[item.link_id]) {
      groupedItems[item.link_id] = { sourceData: null, targetData: null };
    }

    // to support self-linkage with v5.2
    if (
      item.link_id &&
      item.table_id === item.srcT &&
      groupedItems[item.link_id].sourceData !== null
    ) {
      groupedItems[item.link_id].targetData = item;
    } else if (item.link_id && item.table_id === item.srcT) {
      groupedItems[item.link_id].sourceData = item;
    } else if (item.link_id && item.table_id === item.tgtT) {
      groupedItems[item.link_id].targetData = item;
    }
  });

  let filteredData: {
    [linkId: string]: {
      sourceData: ILinksColumnData;
      targetData: ILinksColumnData;
    };
  } = {};

  for (let key in groupedItems) {
    if (Object.prototype.hasOwnProperty.call(groupedItems, key)) {
      filteredData[key] = {
        sourceData: groupedItems[key].sourceData!,
        targetData: groupedItems[key].targetData!,
      };
    }
  }

  const filteredDataResult = Object.values(filteredData).map(
    (g: { sourceData: ILinksColumnData; targetData: ILinksColumnData }) => {
      return {
        type: LINK_TYPE.link,
        sourceData: g.sourceData,
        targetData1st: g.targetData,
      };
    }
  );

  return removeUndefinedOrNull(filteredDataResult);
}

function removeUndefinedOrNull(
  arr: {
    type: string;
    sourceData: ILinksColumnData;
    targetData1st: ILinksColumnData;
  }[]
) {
  return arr.filter(
    (obj) =>
      obj.sourceData !== undefined &&
      obj.sourceData !== null &&
      obj.targetData1st !== undefined &&
      obj.targetData1st !== null
  );
}
function createFormulaCcData(
  data: TableColumn[],
  allTables: TableArray,
  selectedViews: SelectedViews,
  tblAllCols: boolean
) {
  let fCcData: ILinksData[] = [];

  const fCcRowData = data.map((fc: TableColumn) => {
    let secondLinkedTableId: string | undefined;
    const { sourceTableId, firstLinkTableId } = findSourceAndFirstLinkedTableId(
      fc.data.link_column_key,
      allTables,
      selectedViews,
      tblAllCols
    );

    if (firstLinkTableId && fc.data.level2_linked_table_column_key) {
      secondLinkedTableId = findSecondLinkedTableId(
        firstLinkTableId,
        fc.data.level1_linked_table_column_key,
        allTables,
        selectedViews,
        tblAllCols
      );
    }

    if (fc.data.level2_linked_table_column_key) {
      const targetTableKey =
        fc.data.formula === LINK_TYPE.findmax || fc.data.formula === LINK_TYPE.findmin
          ? sourceTableId
          : firstLinkTableId;
      const targetFirstColumnKey =
        fc.data.formula === LINK_TYPE.findmax || fc.data.formula === LINK_TYPE.findmin
          ? fc.data.level2_linked_table_column_key
          : fc.data.level1_linked_table_column_key;
      return {
        type: fc.type,
        formulaType: fc.data.formula,
        sourceData: findData(
          fc.data.formula,
          sourceTableId,
          fc.key,
          allTables,
          selectedViews,
          tblAllCols,
          'source'
        ),
        targetData1st: findData(
          fc.data.formula,
          targetTableKey,
          targetFirstColumnKey,
          allTables,
          selectedViews,
          tblAllCols,
          'target 1'
        ),
        targetData2nd: findData(
          fc.data.formula,
          secondLinkedTableId!,
          fc.data.level2_linked_table_column_key,
          allTables,
          selectedViews,
          tblAllCols,
          'target 2'
        ),
      };
    } else {
      const targetTableKey =
        fc.data.formula === LINK_TYPE.countLinks ? sourceTableId : firstLinkTableId;
      return {
        type: fc.type,
        formulaType: fc.data.formula,
        sourceData: findData(
          fc.data.formula,
          sourceTableId,
          fc.key,
          allTables,
          selectedViews,
          tblAllCols,
          'source'
        ),
        targetData1st: findData(
          fc.data.formula,
          targetTableKey,
          fc.data.level1_linked_table_column_key ||
            fc.data.column_key_in_linked_record ||
            fc.data.link_column_key ||
            fc.data.column_key_for_comparison,
          allTables,
          selectedViews,
          tblAllCols,
          'target'
        ),
      };
    }
  });

  fCcRowData.forEach((fc: ILinksData) => {
    fCcData.push({
      formulaType: fc.formulaType,
      type: fc.targetData2nd ? LINK_TYPE.lnkformula2nd : LINK_TYPE.lnkformula,
      sourceData: fc.sourceData,
      targetData1st: fc.targetData1st,
    });

    if (fc.targetData2nd) {
      fCcData.push({
        formulaType: fc.formulaType,
        type: LINK_TYPE.lnkformula2nd,
        sourceData: fc.targetData1st,
        targetData1st: fc.targetData2nd,
      });
    }
  });
  fCcData = fCcData.filter(
    (i: ILinksData) =>
      Object.prototype.hasOwnProperty.call(i, 'sourceData') && i.sourceData !== undefined
  );

  return fCcData;
}
