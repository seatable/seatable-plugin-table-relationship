/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { FaPlus, FaMinus, FaNoteSticky } from 'react-icons/fa6';
import ReactFlow, {
  Controls,
  ControlButton,
  useNodesState,
  useEdgesState,
  useViewport,
  useReactFlow,
  applyNodeChanges,
  type NodeChange,
  type OnNodesChange,
} from 'reactflow';
import intl from 'react-intl-universal';
import { AVAILABLE_LOCALES, DEFAULT_LOCALE } from '../../locale';
import { PLUGIN_NAME, ACTIVE_PRESET_ID } from '../../utils/template-constants';
import {
  IPluginTRProps,
  ILinksData,
  NodeResultItem,
  RelationshipState,
  TableDisplayState,
} from '../../utils/custom-interfaces/PluginTR';
import CustomNode from './NodesComponent/CustomNode';
import TextNode from './NodesComponent/TextNode';
import HorizontalTangentEdge from './NodesComponent/CustomHorizontalTangentEdge';

// Import styles once
import 'reactflow/dist/style.css';
import '../../styles/custom-styles/overview.css';

// Import utils
import {
  generateNodes,
  updateNodesData,
  arrangeNodesOnGrid,
  isCustomSettingsFn,
  getFreshPresetData,
  setPluginDataStoreFn,
  checkMissingOrExtraIds,
  checkNodesVsTablesIds,
  filterRelationshipLinks,
  filterNotDisplayedNodes,
  //filterNodesWithoutLinks,
  generateEdges,
  generateLinks,
  setViewportPluginDataStoreFn,
  nodeStyleForFontSize,
} from '../../utils/custom-utils/utils';

import { TableArray } from '../../utils/template-interfaces/Table.interface';
import {
  IPresetInfo,
  PresetCustomSettings,
} from '../../utils/template-interfaces/PluginPresets/Presets.interface';
import { IPluginDataStore } from '../../utils/template-interfaces/App.interface';
const { [DEFAULT_LOCALE]: d } = AVAILABLE_LOCALES;

// Plugin Table Relationships Component
const PluginTR: React.FC<IPluginTRProps> = ({
  appActiveState,
  allTables,
  pluginDataStore,
  activeRelationships,
  activeTableDisplay,
  previewHeaderColor,
  resetPositionsToken,
}) => {
  const [nodes, setNodes] = useNodesState([]); // onNodesChange
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [links, setLinks] = useState<ILinksData[]>([]);
  const [tableDisplay, setTableDisplay] = useState(activeTableDisplay);

  const [nodeName, setNodeName] = useState(null);
  const fontSizeSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setStatesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const prevPresetIdRef = useRef(appActiveState.activePresetId);
  const flowContainerRef = useRef<HTMLDivElement>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presetSwitchCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewportRestoredRef = useRef(false);
  const lastViewportRef = useRef<{ x: number; y: number; zoom: number } | null>(null);
  const needsViewportRestoreRef = useRef(true);
  const dragSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hide ReactFlow immediately when preset changes
  if (prevPresetIdRef.current !== appActiveState.activePresetId) {
    flowContainerRef.current?.style.setProperty('opacity', '0');
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    // Suppress all saves during rapid preset switching to prevent
    // resetData cascade (save → local-dtable-changed → resetData → re-render → ...)
    if (presetSwitchCooldownRef.current) clearTimeout(presetSwitchCooldownRef.current);
    presetSwitchCooldownRef.current = setTimeout(() => {
      presetSwitchCooldownRef.current = null;
    }, 300);
    // Fallback: force reveal after 500ms no matter what.
    // Also re-load the preset data if nodes are empty.
    if (revealFallbackRef.current) clearTimeout(revealFallbackRef.current);
    const fallbackPresetId = appActiveState.activePresetId;
    revealFallbackRef.current = setTimeout(() => {
      flowContainerRef.current?.style.setProperty('opacity', '1');
      // If nodes are empty, re-trigger the preset load
      if (nodesRef.current.filter((n: any) => n.type === 'custom').length === 0) {
        const { customSettings } = isCustomSettingsFn(pluginDataStore, allTables, fallbackPresetId);
        setStates(
          customSettings.links,
          customSettings.nodes,
          customSettings.edges || [],
          customSettings.relationship,
          customSettings.tableDisplay
        );
      }
    }, 500);
  }

  const viewPortState = useViewport();
  const reactFlow = useReactFlow();

  // Read stored viewport from SDK on mount for defaultViewport.
  // This runs during component init (not in an effect), so ReactFlow
  // starts with the correct viewport from the very first render.
  const [_pluginVPDataStore, setPluginVPDataStore] = useState(() => {
    try {
      const sdkData = window.dtableSDK?.getPluginSettings(PLUGIN_NAME);
      // appActiveState.activePresetId may still be '0000' on first mount,
      // so also check localStorage for the real active preset ID.
      const presetId =
        appActiveState.activePresetId !== '0000'
          ? appActiveState.activePresetId
          : localStorage.getItem(ACTIVE_PRESET_ID) || appActiveState.activePresetId;
      const preset = sdkData?.presets?.find((p: any) => p._id === presetId);
      if (preset?.customSettings?.vp) {
        return preset.customSettings.vp;
      }
    } catch (e) {
      // SDK not ready yet, fall back to default
    }
    return viewPortState;
  });

  const nodeTypes = useMemo(
    () => ({
      custom: CustomNode,
      textnode: TextNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      horizontalTangent: HorizontalTangentEdge,
    }),
    []
  );

  const [pendingEdgeRefresh, setPendingEdgeRefresh] = useState(false);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.selected) {
          node.data = {
            ...node.data,
            label: nodeName,
          };
        }

        return node;
      })
    );
  }, [nodeName, setNodes]);

  useEffect(() => {
    // Skip during preset switch — the preset switch effect handles everything.
    // Running here too would overwrite the correct nodes from the preset switch effect
    // with re-processed nodes that may have different positions.
    if (presetSwitchCooldownRef.current) return;

    let _edges = edges;
    let displayedTables = allTables.filter((t) =>
      activeTableDisplay.displayedTables?.includes(t._id)
    );
    let _links = generateLinks(
      displayedTables,
      activeTableDisplay.selectedViews,
      activeTableDisplay.tblAllCols
    ); //allTables

    const pluginPresetData = getFreshPresetData(pluginDataStore, appActiveState.activePresetId);
    const cs = pluginPresetData?.customSettings;

    // Filtering the links based on the active relationships
    const filteredLinks = filterRelationshipLinks(_links, activeRelationships);

    // Filtering the nodes based on the tables to display
    const nodesToDisplay = filterNotDisplayedNodes(cs?.nodes, activeTableDisplay);
    let updatedNodes = nodesToDisplay;

    if (
      JSON.stringify(activeTableDisplay.selectedViews) !==
        JSON.stringify(tableDisplay.selectedViews) ||
      activeTableDisplay.tblAllCols !== tableDisplay.tblAllCols
    ) {
      updatedNodes = updateNodesData(
        allTables,
        //activeTableDisplay.displayedTables,
        activeTableDisplay.selectedViews,
        //activeTableDisplay.isAllShown,
        //activeTableDisplay.tblNoLnk,
        activeTableDisplay.tblAllCols,
        //activeTableDisplay.headerColor,
        //activeTableDisplay.fontSize,
        nodesToDisplay
      );
    }

    // Further filtering the nodes to remove any nodes without a type
    let validNodes =
      updatedNodes !== undefined
        ? (updatedNodes.filter((node: any) => node.type !== undefined) as NodeResultItem[])
        : [];

    _edges = generateEdges(filteredLinks, validNodes, activeTableDisplay.edgeStrokes);

    setStates(filteredLinks, validNodes, _edges, activeRelationships, activeTableDisplay);
  }, [
    JSON.stringify(activeTableDisplay.selectedViews),
    activeTableDisplay.tblAllCols,
    JSON.stringify(activeTableDisplay.displayedTables),
  ]); //activeTableDisplay.fontSize,

  // Updating links
  useEffect(() => {
    let displayedTables = allTables.filter((t) =>
      activeTableDisplay.displayedTables?.includes(t._id)
    );
    let _links = generateLinks(
      displayedTables,
      activeTableDisplay.selectedViews,
      activeTableDisplay.tblAllCols
    ); //allTables

    const pluginPresetData = getFreshPresetData(pluginDataStore, appActiveState.activePresetId);
    const cs = pluginPresetData?.customSettings;

    // Filtering the links based on the active relationships
    const filteredLinks = filterRelationshipLinks(_links, activeRelationships);
    const _edges = generateEdges(filteredLinks, cs?.nodes, activeTableDisplay.edgeStrokes);

    setLinks(filteredLinks);
    setEdges(_edges);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activeRelationships)]); //, activeTableDisplay, tableDisplay , activeTableDisplay.displayedTables

  // Updating edge strokes
  useEffect(() => {
    const pluginPresetData = getFreshPresetData(pluginDataStore, appActiveState.activePresetId);
    const cs = pluginPresetData?.customSettings;
    const _edges = generateEdges(cs?.links, cs?.nodes, activeTableDisplay.edgeStrokes);
    setEdges(_edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activeTableDisplay.edgeStrokes)]); //, activeTableDisplay, tableDisplay

  useEffect(() => {
    // Skip during preset switch — the preset switch effect handles fontSize.
    if (presetSwitchCooldownRef.current) return;

    const { isPDSCS, customSettings } = isCustomSettingsFn(
      pluginDataStore,
      allTables,
      appActiveState.activePresetId
    );
    const activeCustomSettings = customSettings;
    const { links, nodes, edges, relationship, tableDisplay } = activeCustomSettings;

    let _nodes = nodes.map((n: any) => ({
      ...n,
      data: {
        ...n.data,
        headerColor: activeTableDisplay.headerColor,
        fontSize: activeTableDisplay.fontSize,
      },
      style: nodeStyleForFontSize(activeTableDisplay.fontSize),
    }));
    // Re-arrange grid positions for non-displaced nodes based on new fontSize
    _nodes = arrangeNodesOnGrid(
      _nodes,
      links,
      activeTableDisplay.fontSize,
      activeTableDisplay.numCols ?? 5
    );
    const nodesWithCallbacks = injectNodeCallbacks(_nodes);
    setNodes(nodesWithCallbacks);
    setPendingEdgeRefresh(true);

    if (fontSizeSaveTimer.current) clearTimeout(fontSizeSaveTimer.current);
    fontSizeSaveTimer.current = setTimeout(() => {
      setPluginDataStoreFn(
        pluginDataStore,
        activeRelationships,
        activeTableDisplay,
        appActiveState.activePresetId,
        nodesWithCallbacks,
        customSettings.links
      );
    }, 500);
  }, [activeTableDisplay.fontSize]);

  // Re-run grid layout when the user changes the column count.
  // Displaced (manually positioned) nodes keep their positions.
  useEffect(() => {
    if (presetSwitchCooldownRef.current) return;
    const { customSettings } = isCustomSettingsFn(
      pluginDataStore,
      allTables,
      appActiveState.activePresetId
    );
    const arranged = arrangeNodesOnGrid(
      customSettings.nodes,
      customSettings.links,
      activeTableDisplay.fontSize,
      activeTableDisplay.numCols ?? 5
    );
    const nodesWithCallbacks = injectNodeCallbacks(arranged);
    setNodes(nodesWithCallbacks);
    setPluginDataStoreFn(
      pluginDataStore,
      activeRelationships,
      activeTableDisplay,
      appActiveState.activePresetId,
      nodesWithCallbacks,
      customSettings.links
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTableDisplay.numCols]);

  // Reset positions: clear `displaced` flag on table nodes, re-run the grid layout,
  // leave text notes untouched. Triggered by an incrementing token from App so a
  // repeated click always fires (and skip the initial 0 value on mount).
  const prevResetTokenRef = useRef<number | undefined>(resetPositionsToken);
  useEffect(() => {
    if (resetPositionsToken === undefined || resetPositionsToken === 0) return;
    if (resetPositionsToken === prevResetTokenRef.current) return;
    prevResetTokenRef.current = resetPositionsToken;
    const { customSettings } = isCustomSettingsFn(
      pluginDataStore,
      allTables,
      appActiveState.activePresetId
    );
    const cleared = customSettings.nodes.map((n: any) => {
      if (n.type === 'textnode') return n;
      return { ...n, position: { ...n.position }, data: { ...n.data, displaced: false } };
    });
    const arranged = arrangeNodesOnGrid(
      cleared,
      customSettings.links,
      activeTableDisplay.fontSize,
      activeTableDisplay.numCols ?? 5
    );
    const nodesWithCallbacks = injectNodeCallbacks(arranged);
    setNodes(nodesWithCallbacks);
    setPluginDataStoreFn(
      pluginDataStore,
      activeRelationships,
      activeTableDisplay,
      appActiveState.activePresetId,
      nodesWithCallbacks,
      customSettings.links
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetPositionsToken]);

  useEffect(() => {
    if (!pendingEdgeRefresh) return;
    setPendingEdgeRefresh(false);
    requestAnimationFrame(() => {
      const { customSettings } = isCustomSettingsFn(
        pluginDataStore,
        allTables,
        appActiveState.activePresetId
      );
      const _edges = generateEdges(
        customSettings.links,
        nodes as NodeResultItem[],
        activeTableDisplay.edgeStrokes
      );
      setEdges(_edges);
    });
  }, [pendingEdgeRefresh, nodes]);

  useEffect(() => {
    let tableListChanged = false;
    const { isPDSCS, customSettings } = isCustomSettingsFn(
      pluginDataStore,
      allTables,
      appActiveState.activePresetId
    );
    // eslint-disable-next-line
    const activeCustomSettings = customSettings;

    const presetChanged = prevPresetIdRef.current !== appActiveState.activePresetId;
    if (isPDSCS === false) {
      // if custom settings are not found, we set nodes, links, edges and relationship
      const { links, nodes, edges, relationship, tableDisplay } = activeCustomSettings;
      setStates(links, nodes, edges, relationship, tableDisplay);
    }

    // On preset switch, use stored tableDisplay; on allTables change, use the prop
    const td = presetChanged ? customSettings.tableDisplay : activeTableDisplay;

    // Dealing with new or deleted table
    let missingTable = allTables.filter((t) => !Object.keys(td.selectedViews).includes(t._id));
    let extraTableId = Object.keys(td.selectedViews).filter(
      (k) =>
        !allTables
          .map((t) => {
            return t._id;
          })
          .includes(k)
    );
    if (missingTable && missingTable.length > 0) {
      for (const mt of missingTable) {
        td.selectedViews[mt._id] = mt.views[0]._id;
        td.displayedTables.push(mt._id);
      }
      tableListChanged = true;
    }
    if (extraTableId && extraTableId.length > 0) {
      for (const eid of extraTableId) {
        delete td.selectedViews[eid];
      }
      td.displayedTables = td.displayedTables.filter((tid: string) => !extraTableId.includes(tid));
      tableListChanged = true;
    }

    const shownTablesNodes = generateNodes(
      allTables,
      td.displayedTables,
      td.selectedViews,
      td.isAllShown,
      td.tblNoLnk,
      td.tblAllCols,
      td.headerColor,
      td.fontSize,
      activeCustomSettings.nodes
    );

    // In any case and whenever there is a change in the Tables, we need to check if the nodes and tables are equal
    // Compare only table nodes (exclude text nodes) since shownTablesNodes only contains table nodes
    const storedTableNodes = activeCustomSettings.nodes.filter((n: any) => n.type !== 'textnode');
    const storedNodesVsTablesNodes = storedTableNodes.length === shownTablesNodes.length;
    // If the nodes and tables are equal, we check if the ids and columns are equal
    //else we find which nodes are missing or extra
    const newCustomSettings = storedNodesVsTablesNodes
      ? checkNodesVsTablesIds(activeCustomSettings, shownTablesNodes, allTables)
      : checkMissingOrExtraIds(activeCustomSettings, shownTablesNodes, allTables);

    let { links, nodes, edges, relationship, tableDisplay } =
      newCustomSettings as PresetCustomSettings;

    // Force save when table list changed or node count mismatch (new/deleted table)
    const needsForceSave = tableListChanged || !storedNodesVsTablesNodes;
    if (tableListChanged || !storedNodesVsTablesNodes) {
      // Re-arrange grid: displaced (user-positioned) nodes keep their positions,
      // new nodes get placed in free grid slots.
      nodes = arrangeNodesOnGrid(nodes, links, tableDisplay.fontSize, tableDisplay.numCols ?? 5);
      tableListChanged = false;
    }

    setStates(links, nodes, edges, relationship, tableDisplay, needsForceSave);

    // Restore viewport on preset switch or initial load.
    // Deferred via requestAnimationFrame so it runs after React commits the
    // setNodes/setEdges state updates above — otherwise ReactFlow's re-render
    // can override the viewport we just set.
    if (presetChanged || needsViewportRestoreRef.current) {
      prevPresetIdRef.current = appActiveState.activePresetId;
      needsViewportRestoreRef.current = false;
      const freshPreset = getFreshPresetData(pluginDataStore, appActiveState.activePresetId);
      const pluginVPDataStore = freshPreset?.customSettings?.vp;
      setPluginVPDataStore(pluginVPDataStore);
      requestAnimationFrame(() => {
        if (pluginVPDataStore === undefined) {
          reactFlow.fitView(); //{ maxZoom: 1.2, minZoom: 0 });
          lastViewportRef.current = reactFlow.getViewport();
        } else {
          reactFlow.setViewport(pluginVPDataStore);
          lastViewportRef.current = pluginVPDataStore;
        }
        // Allow onMoveEnd to save now that viewport has been restored
        viewportRestoredRef.current = true;
      });
    }
  }, [JSON.stringify(allTables), appActiveState.activePresetId]); // activeTableDisplay.fontSize,

  // Changing tables header color
  useEffect(() => {
    if (!previewHeaderColor) return;
    const { customSettings } = isCustomSettingsFn(
      pluginDataStore,
      allTables,
      appActiveState.activePresetId
    );
    const _nodes = customSettings.nodes.map((n: any) => ({
      ...n,
      data: { ...n.data, headerColor: previewHeaderColor },
      style: nodeStyleForFontSize(activeTableDisplay.fontSize),
    }));
    setNodes(injectNodeCallbacks(_nodes));
  }, [previewHeaderColor]);

  useEffect(() => {
    // Skip during preset switch — the preset switch effect handles headerColor.
    if (presetSwitchCooldownRef.current) return;

    const { customSettings } = isCustomSettingsFn(
      pluginDataStore,
      allTables,
      appActiveState.activePresetId
    );
    const _nodes = customSettings.nodes.map((n: any) => ({
      ...n,
      data: {
        ...n.data,
        headerColor: activeTableDisplay.headerColor,
        fontSize: activeTableDisplay.fontSize,
      },
      style: nodeStyleForFontSize(activeTableDisplay.fontSize),
    }));
    setStates(
      customSettings.links,
      _nodes,
      edges,
      customSettings.relationship,
      customSettings.tableDisplay
    );
  }, [activeTableDisplay.headerColor]);

  // This function sets the states of the nodes, links, edges and relationship in the ERD Plugin component
  function setStates(
    _links: any,
    _nodes: any,
    _edges: any,
    _relationship: RelationshipState,
    _tableDisplay: TableDisplayState,
    forceSave: boolean = false
  ) {
    const filteredLinks = filterRelationshipLinks(_links, _relationship);
    const filteredEdges = generateEdges(filteredLinks, _nodes, _tableDisplay.edgeStrokes);
    const unSelectedNodes = _nodes.map((n: any) => ({ ...n, selected: false }));
    const nodesWithCallbacks = injectNodeCallbacks(unSelectedNodes);

    setLinks(filteredLinks);
    setNodes(nodesWithCallbacks);
    setEdges(filteredEdges);
    setTableDisplay(_tableDisplay);
    if (setStatesSaveTimer.current) clearTimeout(setStatesSaveTimer.current);
    // When forceSave is true (table added/removed), save synchronously so the SDK
    // is up-to-date before other effects can read stale data.
    if (forceSave) {
      setPluginDataStoreFn(
        pluginDataStore,
        _relationship,
        _tableDisplay,
        appActiveState.activePresetId,
        nodesWithCallbacks,
        _links
      );
    } else if (!presetSwitchCooldownRef.current) {
      setStatesSaveTimer.current = setTimeout(() => {
        setPluginDataStoreFn(
          pluginDataStore,
          _relationship,
          _tableDisplay,
          appActiveState.activePresetId,
          nodesWithCallbacks,
          _links
        );
      }, 0);
    }
  }

  const dragEdgeRafRef = useRef<number | null>(null);

  const onNodeDrag = useCallback(
    (event: any, node: any) => {
      node.data.selected = true;
      // Throttle edge handle updates to one per animation frame
      if (dragEdgeRafRef.current) return;
      dragEdgeRafRef.current = requestAnimationFrame(() => {
        dragEdgeRafRef.current = null;
        setEdges((eds) => {
          let changed = false;
          const updated = eds.map((e) => {
            if (e.source === e.target) return e;
            const srcX =
              e.source === node.id ? node.position.x : reactFlow.getNode(e.source)?.position.x;
            const tgtX =
              e.target === node.id ? node.position.x : reactFlow.getNode(e.target)?.position.x;
            if (srcX === undefined || tgtX === undefined) return e;
            const srcOnLeft = srcX + 90 < tgtX;
            const wrongSide = srcOnLeft ? '_l-' : '_r-';
            // Only update if a swap is actually needed
            if (!e.sourceHandle?.includes(wrongSide)) return e;
            changed = true;
            const srcSide = srcOnLeft ? 'r' : 'l';
            const tgtSide = srcOnLeft ? 'l' : 'r';
            return {
              ...e,
              sourceHandle: e.sourceHandle?.replace(`_${srcOnLeft ? 'l' : 'r'}-`, `_${srcSide}-`),
              targetHandle: e.targetHandle?.replace(`_${srcOnLeft ? 'r' : 'l'}-`, `_${tgtSide}-`),
            };
          });
          return changed ? updated : eds;
        });
      });
    },
    [reactFlow, setEdges]
  );

  const SNAP_THRESHOLD = 10;
  const snapNodeIdRef = useRef<string | null>(null);

  const snapSides = ['left', 'right', 'top', 'bottom'] as const;

  function applySnapHighlight(
    nodeId: string,
    sides: { left: boolean; right: boolean; snapTop: boolean; snapBottom: boolean },
    headerColor?: string
  ) {
    const el = document.querySelector(`[data-id="${nodeId}"]`) as HTMLElement | null;
    if (!el) return;
    const active = {
      left: sides.left,
      right: sides.right,
      top: sides.snapTop,
      bottom: sides.snapBottom,
    };
    const hasSnap = Object.values(active).some(Boolean);
    if (!hasSnap) {
      clearSnapHighlight();
      return;
    }
    if (headerColor) {
      const hex = headerColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      el.style.setProperty('--snap-color', `rgba(${r}, ${g}, ${b}, 0.35)`);
    }
    for (const side of snapSides) {
      const existing = el.querySelector(`.snap-glow-${side}`);
      if (active[side] && !existing) {
        const div = document.createElement('div');
        div.className = `snap-glow snap-glow-${side}`;
        el.appendChild(div);
      } else if (!active[side] && existing) {
        existing.remove();
      }
    }
    snapNodeIdRef.current = nodeId;
  }

  function clearSnapHighlight() {
    if (!snapNodeIdRef.current) return;
    const el = document.querySelector(`[data-id="${snapNodeIdRef.current}"]`) as HTMLElement | null;
    if (el) el.querySelectorAll('.snap-glow').forEach((g) => g.remove());
    snapNodeIdRef.current = null;
  }

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const result = applyNodeChanges(changes, nds);

        // Only snap during drag (position changes)
        const posChanges = changes.filter(
          (
            c
          ): c is NodeChange & { id: string; position: { x: number; y: number }; dragging: true } =>
            c.type === 'position' &&
            'dragging' in c &&
            c.dragging === true &&
            'position' in c &&
            c.position != null
        );

        // Clear snap highlights when drag ends
        const dragEndChanges = changes.filter(
          (c) => c.type === 'position' && 'dragging' in c && c.dragging === false
        );
        if (dragEndChanges.length > 0) {
          clearSnapHighlight();
        }

        if (posChanges.length === 0) return result;

        for (const change of posChanges) {
          const draggedNode = result.find((n) => n.id === change.id);
          if (!draggedNode || !draggedNode.width || !draggedNode.height) continue;

          const dLeft = draggedNode.position.x;
          const dRight = dLeft + draggedNode.width;
          const dTop = draggedNode.position.y;
          const dBottom = dTop + draggedNode.height;

          let snapX: number | null = null;
          let snapY: number | null = null;
          let bestDx = SNAP_THRESHOLD;
          let bestDy = SNAP_THRESHOLD;
          let snapLeft = false,
            snapRight = false,
            snapTop = false,
            snapBottom = false;

          for (const other of result) {
            if (other.id === change.id || other.hidden || !other.width || !other.height) continue;

            const oLeft = other.position.x;
            const oRight = oLeft + other.width;
            const oTop = other.position.y;
            const oBottom = oTop + other.height;

            // Horizontal snapping
            const hSnaps = [
              { diff: Math.abs(dLeft - oLeft), target: oLeft, side: 'left' as const },
              {
                diff: Math.abs(dRight - oRight),
                target: oRight - draggedNode.width,
                side: 'right' as const,
              },
              { diff: Math.abs(dLeft - oRight), target: oRight, side: 'left' as const },
              {
                diff: Math.abs(dRight - oLeft),
                target: oLeft - draggedNode.width,
                side: 'right' as const,
              },
            ];
            for (const s of hSnaps) {
              if (s.diff < bestDx) {
                bestDx = s.diff;
                snapX = s.target;
                snapLeft = s.side === 'left';
                snapRight = s.side === 'right';
              }
            }

            // Vertical snapping
            const vSnaps = [
              { diff: Math.abs(dTop - oTop), target: oTop, side: 'top' as const },
              {
                diff: Math.abs(dBottom - oBottom),
                target: oBottom - draggedNode.height,
                side: 'bottom' as const,
              },
              { diff: Math.abs(dTop - oBottom), target: oBottom, side: 'top' as const },
              {
                diff: Math.abs(dBottom - oTop),
                target: oTop - draggedNode.height,
                side: 'bottom' as const,
              },
            ];
            for (const s of vSnaps) {
              if (s.diff < bestDy) {
                bestDy = s.diff;
                snapY = s.target;
                snapTop = s.side === 'top';
                snapBottom = s.side === 'bottom';
              }
            }
          }

          if (snapX !== null) draggedNode.position = { ...draggedNode.position, x: snapX };
          if (snapY !== null) draggedNode.position = { ...draggedNode.position, y: snapY };

          // Apply snap highlight via DOM (no React re-render)
          applySnapHighlight(
            change.id,
            {
              left: snapX !== null && snapLeft,
              right: snapX !== null && snapRight,
              snapTop: snapY !== null && snapTop,
              snapBottom: snapY !== null && snapBottom,
            },
            draggedNode.data?.headerColor
          );
        }

        return result;
      });
    },
    [setNodes]
  );

  const onNodeDragStop = useCallback(
    (event: any, node: any) => {
      // Update node position and deselect
      setNodes((nds) =>
        injectNodeCallbacks(
          nds.map((n) => {
            if (n.id === node.id) {
              return { ...n, data: { ...n.data, selected: false, displaced: true } };
            }
            return n;
          }) as NodeResultItem[]
        )
      );

      // Swap edge handle sides based on final node positions
      setEdges((eds) =>
        eds.map((e) => {
          if (e.source === e.target) return e;
          const srcX =
            e.source === node.id ? node.position.x : reactFlow.getNode(e.source)?.position.x;
          const tgtX =
            e.target === node.id ? node.position.x : reactFlow.getNode(e.target)?.position.x;
          if (srcX === undefined || tgtX === undefined) return e;
          const srcOnLeft = srcX + 90 < tgtX;
          if (!e.sourceHandle?.includes(srcOnLeft ? '_l-' : '_r-')) return e;
          return {
            ...e,
            sourceHandle: e.sourceHandle?.replace(
              `_${srcOnLeft ? 'l' : 'r'}-`,
              `_${srcOnLeft ? 'r' : 'l'}-`
            ),
            targetHandle: e.targetHandle?.replace(
              `_${srcOnLeft ? 'r' : 'l'}-`,
              `_${srcOnLeft ? 'l' : 'r'}-`
            ),
          };
        })
      );

      // Persist after a delay to avoid triggering resetData cascade immediately
      if (dragSaveTimerRef.current) clearTimeout(dragSaveTimerRef.current);
      dragSaveTimerRef.current = setTimeout(() => {
        dragSaveTimerRef.current = null;
        const currentNodes = reactFlow.getNodes();
        setPluginDataStoreFn(
          pluginDataStore,
          activeRelationships,
          activeTableDisplay,
          appActiveState.activePresetId,
          currentNodes,
          links
        );
      }, 100);
    },
    [pluginDataStore, activeRelationships, activeTableDisplay, appActiveState.activePresetId, links]
  );

  function uuidv4() {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
      (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
    );
  }

  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;
          return {
            ...n,
            data: { ...n.data, ...newData },
          };
        })
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      const currentNodes = reactFlow.getNodes();
      const updatedNodes = currentNodes.filter((n) => n.id !== nodeId);
      const currentViewport = reactFlow.getViewport();
      setPluginVPDataStore(currentViewport);

      // Single SDK write for both viewport and nodes to avoid multiple resetData cascades
      const currentData = window.dtableSDK.getPluginSettings(PLUGIN_NAME) || pluginDataStore;
      window.dtableSDK.updatePluginSettings(PLUGIN_NAME, {
        ...currentData,
        presets: currentData.presets.map((preset: any) => {
          if (preset._id === appActiveState.activePresetId) {
            return {
              ...preset,
              customSettings: {
                ...preset.customSettings,
                vp: currentViewport,
                nodes: updatedNodes,
                links: links,
                relationship: activeRelationships,
                tableDisplay: activeTableDisplay,
              },
            };
          }
          return preset;
        }),
      });
      setNodes(updatedNodes);
    },
    [pluginDataStore, appActiveState.activePresetId, activeRelationships, activeTableDisplay, links]
  );

  const saveNodeData = useCallback(
    (nodeId: string, newData: any) => {
      const currentNodes = reactFlow.getNodes();
      const updatedNodes = currentNodes.map((n) => {
        if (n.id !== nodeId) return n;
        return { ...n, data: { ...n.data, ...newData } };
      });
      // Save to SDK before triggering React state changes
      setPluginDataStoreFn(
        pluginDataStore,
        activeRelationships,
        activeTableDisplay,
        appActiveState.activePresetId,
        updatedNodes,
        links
      );
      setNodes(updatedNodes);
    },
    [pluginDataStore, activeRelationships, activeTableDisplay, appActiveState.activePresetId, links]
  );

  function injectNodeCallbacks(nodes: any[]) {
    return nodes.map((n) => {
      if (n.type !== 'textnode') return n;
      return {
        ...n,
        selected: n.selected ?? false,
        data: {
          ...n.data,
          onUpdate: updateNodeData,
          onSave: saveNodeData,
          onDelete: deleteNode,
        },
      };
    });
  }

  function addNewNode(fontSize: number) {
    const currentViewport = reactFlow.getViewport();
    setPluginVPDataStore(currentViewport);

    const flowContainer = document.querySelector('.react-flow')?.getBoundingClientRect();
    const screenPosition = {
      x: (flowContainer?.left ?? 0) + 100,
      y: (flowContainer?.bottom ?? 0) - 150,
    };

    const flowPosition = reactFlow.screenToFlowPosition(screenPosition);

    const newNode = {
      id: uuidv4(),
      type: 'textnode',
      position: flowPosition,
      hidden: false,
      connectable: false,
      data: {
        name: intl.get('custom_plugin.new_text_node').d(`${d.custom_plugin.new_text_node}`),
        headerColor: 'white',
        hasBackground: true,
        fontSize: fontSize,
        columns: [],
        onUpdate: updateNodeData,
        onSave: saveNodeData,
        onDelete: deleteNode,
      },
      style: nodeStyleForFontSize(fontSize),
    } as NodeResultItem;
    const currentNodes = reactFlow.getNodes();
    const updatedNodes = currentNodes.concat(newNode);

    // Single SDK write for both viewport and nodes to avoid multiple resetData cascades
    const currentData = window.dtableSDK.getPluginSettings(PLUGIN_NAME) || pluginDataStore;
    window.dtableSDK.updatePluginSettings(PLUGIN_NAME, {
      ...currentData,
      presets: currentData.presets.map((preset: any) => {
        if (preset._id === appActiveState.activePresetId) {
          return {
            ...preset,
            customSettings: {
              ...preset.customSettings,
              vp: currentViewport,
              nodes: updatedNodes,
              links: links,
              relationship: activeRelationships,
              tableDisplay: activeTableDisplay,
            },
          };
        }
        return preset;
      }),
    });
    setNodes(updatedNodes);
  }

  function onToggleView() {
    reactFlow.fitView(); //{ maxZoom: 1.2, minZoom: 0 });
    const fitView = reactFlow.getViewport();
    lastViewportRef.current = fitView;
    setViewportPluginDataStoreFn(pluginDataStore, appActiveState.activePresetId, fitView);
  }
  // Reveal ReactFlow after all effects have settled (this effect runs last)
  // Each render resets the timer; reveal only after no more renders for 50ms
  useEffect(() => {
    if (flowContainerRef.current?.style.opacity === '0') {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      revealTimerRef.current = setTimeout(() => {
        flowContainerRef.current?.style.setProperty('opacity', '1');
        if (revealFallbackRef.current) clearTimeout(revealFallbackRef.current);
      }, 50);
    }
  });

  // Keep refs fresh for unmount cleanup (no deps needed on the effect itself)
  const pluginDataStoreRef = useRef(pluginDataStore);
  pluginDataStoreRef.current = pluginDataStore;
  const activePresetIdRef = useRef(appActiveState.activePresetId);
  activePresetIdRef.current = appActiveState.activePresetId;

  // Save viewport on unmount (plugin close) and clear all active timers.
  // Uses lastViewportRef because reactFlow.getViewport() returns defaults during teardown.
  useEffect(() => {
    return () => {
      if (lastViewportRef.current) {
        setViewportPluginDataStoreFn(
          pluginDataStoreRef.current,
          activePresetIdRef.current,
          lastViewportRef.current
        );
      }
      // Clear all timers to prevent callbacks firing on unmounted component
      if (fontSizeSaveTimer.current) clearTimeout(fontSizeSaveTimer.current);
      if (setStatesSaveTimer.current) clearTimeout(setStatesSaveTimer.current);
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      if (revealFallbackRef.current) clearTimeout(revealFallbackRef.current);
      if (presetSwitchCooldownRef.current) clearTimeout(presetSwitchCooldownRef.current);
      if (dragSaveTimerRef.current) clearTimeout(dragSaveTimerRef.current);
      if (dragEdgeRafRef.current) cancelAnimationFrame(dragEdgeRafRef.current);
    };
  }, []);

  // Show a crosshair cursor over the chart while Shift is held, to surface the
  // (otherwise hidden) shift-drag rubber-band selection feature. Clear on blur
  // so the class doesn't get stuck if the user alt-tabs while holding Shift.
  useEffect(() => {
    const setShift = (pressed: boolean) => {
      const el = flowContainerRef.current;
      if (!el) return;
      if (pressed) el.classList.add('shift-pressed');
      else el.classList.remove('shift-pressed');
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShift(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShift(false);
    };
    const onBlur = () => setShift(false);
    // capture phase so we always see Shift first, even if ReactFlow's own
    // document-level handler stops propagation for other keys
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // const proOptions = { hideAttribution: true };
  return (
    <div ref={flowContainerRef} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        // key={nodes.filter((n) => n.type === 'custom').length}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        defaultViewport={_pluginVPDataStore}
        fitView={false}
        minZoom={0.3}
        maxZoom={1.5}
        // Disable ReactFlow's built-in Backspace=delete shortcut. Table nodes
        // represent real tables; an accidental delete would just be re-created
        // by reconciliation on next load, but lose user-positioned coordinates.
        // Text-note deletion still works through the dedicated trash button.
        deleteKeyCode={null}
        // proOptions={proOptions}
        onMoveEnd={() => {
          const vp = reactFlow.getViewport();
          // Always track latest viewport for unmount save
          lastViewportRef.current = vp;
          // Skip SDK writes before viewport has been restored,
          // otherwise the default {x:0,y:0,zoom:1} overwrites the stored viewport.
          if (!viewportRestoredRef.current) return;
          setViewportPluginDataStoreFn(pluginDataStore, appActiveState.activePresetId, vp);
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}>
        <Controls showZoom={false} showFitView={false} showInteractive={false}>
          <ControlButton
            title={intl.get('custom_plugin.add_text_node').d(`${d.custom_plugin.add_text_node}`)}
            onClick={() => addNewNode(activeTableDisplay.fontSize)}>
            <FaNoteSticky />
          </ControlButton>
          <ControlButton
            title={intl.get('custom_plugin.zoom_in').d(`${d.custom_plugin.zoom_in}`)}
            onClick={() => reactFlow.zoomIn()}>
            <FaPlus />
          </ControlButton>
          <ControlButton
            title={intl.get('custom_plugin.zoom_out').d(`${d.custom_plugin.zoom_out}`)}
            onClick={() => reactFlow.zoomOut()}>
            <FaMinus />
          </ControlButton>
          <ControlButton
            title={intl.get('custom_plugin.fit_view').d(`${d.custom_plugin.fit_view}`)}
            onClick={() => onToggleView()}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 30">
              <path d="M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z"></path>
            </svg>
          </ControlButton>
        </Controls>
      </ReactFlow>
    </div>
  );
};

export default PluginTR;
