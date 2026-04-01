/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import info from '../src/plugin-config/info.json';

// Import of Component
import Header from './components/template-components/Header';
import PluginSettings from './components/template-components/PluginSettings';
import PluginPresets from './components/template-components/PluginPresets';
import ResizableWrapper from './components/template-components/ResizableWrapper';
import PluginTR from './components/custom-components/index';
// Import of Interfaces
import {
  AppActiveState,
  AppIsShowState,
  IActiveComponents,
  IAppProps,
  IPluginDataStore,
} from './utils/template-interfaces/App.interface';
import {
  TableArray,
  TableViewArray,
  Table,
  TableView,
  TableRow,
  IActiveTableAndView,
} from './utils/template-interfaces/Table.interface';
import { PresetsArray } from './utils/template-interfaces/PluginPresets/Presets.interface';
import { SelectOption } from './utils/template-interfaces/PluginSettings.interface';
// Import of CSS
import styles from './styles/template-styles/Plugin.module.scss';
import './assets/css/plugin-layout.css';
// Import of Constants
import {
  INITIAL_IS_SHOW_STATE,
  INITIAL_CURRENT_STATE,
  PLUGIN_NAME,
  DEFAULT_PLUGIN_DATA,
  ACTIVE_PRESET_ID,
} from './utils/template-constants';
import './locale';
import {
  cleanActiveTable,
  cleanActiveTableViews,
  cleanAllTables,
  createDefaultPluginDataStore,
  findPresetName,
  getActiveStateSafeGuard,
  getActiveTableAndActiveView,
  getDefaultLinkColumn,
  getPluginDataStore,
  isMobile,
  parsePluginDataToActiveState,
} from './utils/template-utils/utils';
import { SettingsOption } from './utils/types';
import { ReactFlowProvider } from 'reactflow';
import {
  RelationshipState,
  TableDisplayState,
  PreviewHeaderColorState,
} from './utils/custom-interfaces/PluginTR';
import { AVAILABLE_LOCALES, DEFAULT_LOCALE } from './locale';
import { generateDefaultCustomSettings } from './utils/custom-utils/utils';
import { visitParameterList } from 'typescript';

// Normalize strokeDasharray values that were corrupted by old generateEdges mutation.
// Maps computed values like '3 3' back to canonical '5 5' (dashed), '1 3' to '1 5' (dotted).
function normalizeEdgeStrokes(tableDisplay: TableDisplayState): TableDisplayState {
  if (!tableDisplay.edgeStrokes) return tableDisplay;
  const normalize = (val: string): string => {
    if (!val || val === '0') return '0';
    const parts = val.split(' ');
    if (parts.length === 2 && parts[0] === parts[1]) return '5 5';
    if (parts.length === 2 && parts[0] !== parts[1]) return '1 5';
    return '0';
  };
  return {
    ...tableDisplay,
    edgeStrokes: {
      link: {
        ...tableDisplay.edgeStrokes.link,
        strokeDasharray: normalize(tableDisplay.edgeStrokes.link.strokeDasharray),
      },
      formula: {
        ...tableDisplay.edgeStrokes.formula,
        strokeDasharray: normalize(tableDisplay.edgeStrokes.formula.strokeDasharray),
      },
      formula2nd: {
        ...tableDisplay.edgeStrokes.formula2nd,
        strokeDasharray: normalize(tableDisplay.edgeStrokes.formula2nd.strokeDasharray),
      },
    },
  };
}

// Fill in missing tableDisplay fields with defaults for presets created before these fields existed.
function normalizeTableDisplay(td: TableDisplayState): TableDisplayState {
  return {
    ...td,
    tblAllCols: td.tblAllCols ?? true,
    tblNoLnk: td.tblNoLnk ?? true,
    isAllShown: td.isAllShown ?? true,
    isBackground: td.isBackground ?? false,
    headerColor: td.headerColor ?? '#ED7109',
    fontSize: td.fontSize ?? 14,
    backgroundColor: td.backgroundColor ?? '#F5F5F5',
    edgeStrokes: td.edgeStrokes ?? {
      link: { stroke: '#212529', strokeWidth: 1, strokeDasharray: '0' },
      formula: { stroke: '#212529', strokeWidth: 1, strokeDasharray: '5 5' },
      formula2nd: { stroke: '#212529', strokeWidth: 1, strokeDasharray: '1 5' },
    },
  };
}

const App: React.FC<IAppProps> = (props) => {
  const { isDevelopment, lang } = props;

  // Debounce timer for resetData triggered by SDK change events.
  // Prevents the save→subscribe→resetData infinite cascade: every SDK write
  // (from App or PluginTR) fires local-dtable-changed, which would call resetData,
  // which saves again, etc.  Debouncing collapses rapid cascades into a single call.
  const resetDataTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Boolean state to show/hide the plugin's components
  const [isShowState, setIsShowState] = useState<AppIsShowState>(INITIAL_IS_SHOW_STATE);
  const { isShowPlugin, isShowSettings, isLoading, isShowWaiting, isShowPresets } = isShowState;
  // Tables, Presets, Views as dataStates. The main data of the plugin
  const [allTables, setAllTables] = useState<TableArray>([]);
  const [activeTableViews, setActiveTableViews] = useState<TableViewArray>([]);
  const [pluginDataStore, setPluginDataStore] = useState<IPluginDataStore>(DEFAULT_PLUGIN_DATA);
  const [pluginPresets, setPluginPresets] = useState<PresetsArray>([]);
  // appActiveState: Define the app's active Preset + (Table + View) state using the useState hook
  // For better understanding read the comments in the AppActiveState interface
  const [appActiveState, setAppActiveState] = useState<AppActiveState>(INITIAL_CURRENT_STATE);
  const [activeComponents, setActiveComponents] = useState<IActiveComponents>({});
  const [activeRelationships, setActiveRelationships] = useState<RelationshipState>({
    recRel: true,
    recSelfRel: true,
    lkRel: true,
    lk2Rel: true,
    countLinks: true,
    rollup: true,
    findmax: true,
    findmin: true,
    /*tblNoLnk: true,
    tblAllCols: true,
    isAllShown: true,*/
  });
  const [activeTableDisplay, setActiveTableDisplay] = useState<TableDisplayState>({
    displayedTables: allTables.map((t) => {
      return t._id;
    }),
    selectedViews: Object.assign(
      {},
      ...allTables.map((t) => ({ [t._id]: t.views.filter((v) => v.type === 'table')[0]._id }))
    ),
    isAllShown: true,
    isBackground: false,
    headerColor: '#ED7109',
    fontSize: 14,
    backgroundColor: '#F5F5F5',
    tblNoLnk: true,
    tblAllCols: true,
    edgeStrokes: {
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
    },
  });
  const [previewHeaderColor, setPreviewHeaderColor] = useState<string | null>(null);
  // const [previewHeaderColor, setPreviewHeaderColor] = useState<PreviewHeaderColorState>({previewHeaderColor: '#ED7109'});
  // Destructure properties from the app's active state for easier access
  const { activeTable, activePresetId, activePresetIdx } = appActiveState;

  useEffect(() => {
    initPluginDTableData();
    return () => {
      unsubscribeLocalDtableChanged();
      unsubscribeRemoteDtableChanged();
      if (resetDataTimerRef.current) clearTimeout(resetDataTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isMobile()) {
      setIsShowState((prevState) => ({ ...prevState, isShowPresets: false }));
    }
  }, []);

  const initPluginDTableData = async () => {
    if (isDevelopment) {
      // local develop //
      window.dtableSDK.subscribe('dtable-connect', () => {
        onDTableConnect();
      });
    }
    unsubscribeLocalDtableChanged = window.dtableSDK.subscribe('local-dtable-changed', () => {
      onDTableChanged();
    });
    unsubscribeRemoteDtableChanged = window.dtableSDK.subscribe('remote-dtable-changed', () => {
      onDTableChanged();
    });
    resetData();
  };

  let unsubscribeLocalDtableChanged = () => {
    throw new Error('Method not implemented.');
  };
  let unsubscribeRemoteDtableChanged = () => {
    throw new Error('Method not implemented.');
  };

  const onDTableConnect = () => {
    resetData();
  };
  const onDTableChanged = () => {
    // Debounce to collapse rapid save→event→resetData cascades into one call.
    if (resetDataTimerRef.current) clearTimeout(resetDataTimerRef.current);
    resetDataTimerRef.current = setTimeout(() => {
      resetData();
    }, 200);
  };

  const resetData = async () => {
    try {
      let allTables: TableArray = cleanAllTables(); // All the Tables of the Base
      let activeTable: Table = cleanActiveTable(); // How is the ActiveTable Set? allTables[0]?
      let activeTableViews: TableViewArray = cleanActiveTableViews(activeTable); // All the Views of the specific Active Table
      let pluginDataStore: IPluginDataStore = getPluginDataStore(activeTable, PLUGIN_NAME);
      let pluginPresets: PresetsArray = pluginDataStore.presets; // An array with all the Presets

      let localActivePresetId = localStorage.getItem(ACTIVE_PRESET_ID);
      if (!localActivePresetId) {
        if (!pluginPresets || pluginPresets.length === 0) {
          // No presets exist yet — create defaults before accessing [0]
          const defaultPluginDataStore: IPluginDataStore = createDefaultPluginDataStore(
            activeTable,
            PLUGIN_NAME
          );
          window.dtableSDK.updatePluginSettings(PLUGIN_NAME, defaultPluginDataStore);
          pluginDataStore = defaultPluginDataStore;
          pluginPresets = defaultPluginDataStore.presets;
        }
        localActivePresetId = pluginPresets[0]._id;
        localStorage.setItem(ACTIVE_PRESET_ID, localActivePresetId);
      }
      setActiveComponents((prevState) => ({
        ...prevState,
        settingsDropDowns: info.active_components.settings_dropdowns,
        add_row_button: info.active_components.add_row_button,
      }));
      setPluginDataStore(pluginDataStore);
      setAllTables(allTables);
      setPluginPresets(pluginPresets);
      setIsShowState((prevState) => ({ ...prevState, isLoading: false }));

      if (localActivePresetId) {
        const appActiveState = parsePluginDataToActiveState(
          pluginDataStore,
          pluginPresets,
          allTables
        );

        // Reconcile tables in ALL presets: add new tables / remove deleted tables.
        // Must use local allTables (not React state which is stale).
        const allTableIds = allTables.map((t) => t._id);
        let anyPresetChanged = false;
        for (const preset of pluginPresets) {
          if (!preset?.customSettings?.tableDisplay?.selectedViews) continue;
          // Normalize missing fields to defaults for old presets
          preset.customSettings.tableDisplay = normalizeTableDisplay(
            preset.customSettings.tableDisplay
          );
          const td = preset.customSettings.tableDisplay;
          let changed = false;
          for (const t of allTables) {
            if (!(t._id in td.selectedViews)) {
              td.selectedViews[t._id] =
                t.views.filter((v: any) => v.type === 'table')[0]?._id || t.views[0]._id;
              if (!td.displayedTables.includes(t._id)) {
                td.displayedTables.push(t._id);
              }
              changed = true;
            }
          }
          const extraIds = Object.keys(td.selectedViews).filter((k) => !allTableIds.includes(k));
          if (extraIds.length > 0) {
            for (const eid of extraIds) {
              delete td.selectedViews[eid];
            }
            td.displayedTables = td.displayedTables.filter((id: string) =>
              allTableIds.includes(id)
            );
            changed = true;
          }
          td.displayedTables = Array.from(new Set(td.displayedTables));
          if (changed) anyPresetChanged = true;
        }
        if (anyPresetChanged) {
          window.dtableSDK.updatePluginSettings(PLUGIN_NAME, {
            ...pluginDataStore,
            presets: pluginPresets,
          });
        }

        onSelectPreset(localActivePresetId, appActiveState);
        const activePresetRelationship = pluginPresets.find((p) => {
          return p._id === localActivePresetId;
        })?.customSettings?.relationship;
        if (activePresetRelationship) {
          setActiveRelationships(activePresetRelationship);
        }
        const activePresetTableDisplay = pluginPresets.find((p) => {
          return p._id === localActivePresetId;
        })?.customSettings?.tableDisplay;
        if (activePresetTableDisplay) {
          setActiveTableDisplay(
            normalizeTableDisplay(normalizeEdgeStrokes(activePresetTableDisplay))
          );
        }
        return;
      } else {
        // If there are no presets, the default one is created
        if (pluginPresets.length === 0) {
          const defaultPluginDataStore: IPluginDataStore = createDefaultPluginDataStore(
            activeTable,
            PLUGIN_NAME
          );
          window.dtableSDK.updatePluginSettings(PLUGIN_NAME, defaultPluginDataStore);
        }
        // Retrieve both objects of activeTable and activeView from the pluginPresets NOT from the window.dtableSDK
        const activeTableAndView: IActiveTableAndView = getActiveTableAndActiveView(
          pluginPresets,
          allTables
        );
        // Get the activeViewRows from the window.dtableSDK
        const activeViewRows: TableRow[] = [];

        const activeStateSafeGuard = getActiveStateSafeGuard(
          pluginPresets,
          activeTable,
          activeTableAndView,
          activeViewRows
        );

        // At first we set the first Preset as the active one
        setActiveTableViews(activeTableAndView?.table?.views || activeTableViews);
        setAppActiveState(activeStateSafeGuard);
      }
    } catch (err) {
      console.error('[Table Relationships] resetData failed:', err);
      // Ensure plugin still renders even if data loading fails
      setIsShowState((prevState) => ({ ...prevState, isLoading: false }));
    }
  };

  const onPluginToggle = () => {
    setTimeout(() => {
      setIsShowState((prevState) => ({ ...prevState, isShowPlugin: false }));
    }, 300);
    window.app.onClosePlugin(lang);
  };

  /**
   * Handles the selection of a preset, updating the active state and associated data accordingly.
   */
  const onSelectPreset = (presetId: string, newPresetActiveState?: AppActiveState) => {
    localStorage.setItem(ACTIVE_PRESET_ID, presetId);

    let updatedActiveState: AppActiveState;
    let updatedActiveTableViews: TableView[];
    const _activePresetIdx = pluginPresets.findIndex((preset) => preset._id === presetId);

    if (newPresetActiveState !== undefined) {
      updatedActiveState = {
        ...newPresetActiveState,
      };
      updatedActiveTableViews = newPresetActiveState?.activeTable?.views!;
    } else {
      const activePreset = pluginPresets.find((preset) => preset._id === presetId);
      const selectedTable = activePreset?.settings?.selectedTable;
      const selectedView = activePreset?.settings?.selectedView;

      const _activeTableName = selectedTable?.label as string;
      const _activeTableId = selectedTable?.value as string;
      const _activeViewId = selectedView?.value as string;

      updatedActiveTableViews =
        allTables.find((table) => table._id === _activeTableId)?.views || [];

      updatedActiveState = {
        activeTable: allTables.find((table) => table._id === _activeTableId) || activeTable,
        activeTableName: _activeTableName,
        activeTableView:
          updatedActiveTableViews.find((view) => view._id === _activeViewId) || activeTableViews[0],
        activePresetId: presetId,
        activePresetIdx: _activePresetIdx,
      };

      updatePluginDataStore({
        ...pluginDataStore,
        activePresetId: presetId,
        activePresetIdx: _activePresetIdx,
      });
    }

    setActiveTableViews(updatedActiveTableViews);
    setAppActiveState(updatedActiveState);

    // Also update relationships and tableDisplay in the same batch
    // to avoid flickering from stale props during preset switch.
    // Read from SDK (source of truth) instead of pluginPresets React state,
    // which may be stale when called from resetData.
    const freshPDS = window.dtableSDK.getPluginSettings(PLUGIN_NAME);
    const freshPreset =
      freshPDS?.presets?.find((p: any) => p._id === presetId) || pluginPresets[_activePresetIdx];
    if (freshPreset?.customSettings?.relationship) {
      setActiveRelationships(freshPreset.customSettings.relationship);
    } else {
      const defaults = generateDefaultCustomSettings(allTables);
      setActiveRelationships(defaults.relationship);
    }
    if (freshPreset?.customSettings?.tableDisplay) {
      setActiveTableDisplay(
        normalizeTableDisplay(normalizeEdgeStrokes(freshPreset.customSettings.tableDisplay))
      );
    } else {
      const defaults = generateDefaultCustomSettings(allTables);
      setActiveTableDisplay(defaults.tableDisplay);
    }
  };

  /**
   * Updates the presets and associated plugin data store.
   */
  const updatePresets = (
    _activePresetIdx: number,
    updatedPresets: PresetsArray,
    pluginDataStore: IPluginDataStore,
    activePresetId: string,
    callBack: any = null
  ) => {
    let _pluginDataStore = {
      ...pluginDataStore,
      activePresetId: activePresetId,
      activePresetIdx: _activePresetIdx,
    };
    const updatedActiveState = (prevState: AppActiveState) => ({
      ...prevState,
      activePresetId: activePresetId,
      activePresetIdx: _activePresetIdx,
    });

    setAppActiveState((prevState: AppActiveState) => updatedActiveState(prevState));
    setPluginPresets(updatedPresets);
    setPluginDataStore(_pluginDataStore);
    updatePluginDataStore(_pluginDataStore);
  };

  // Update plugin data store (old plugin settings)
  const updatePluginDataStore = (pluginDataStore: IPluginDataStore) => {
    window.dtableSDK.updatePluginSettings(PLUGIN_NAME, pluginDataStore);
  };

  /**
   * Updates the active data based on the settings of the first preset.
   * Retrieves table and view information from the first preset's settings, fetches the corresponding
   * data from the available tables, and updates the active state accordingly.
   */
  const updateActiveData = () => {
    let allTables: TableArray = cleanAllTables();
    let tableOfPresetOne = pluginPresets[0].settings?.selectedTable || {
      value: allTables[0]._id,
      label: allTables[0].name,
    };
    let viewOfPresetOne = pluginPresets[0].settings?.selectedView || {
      value: allTables[0].views[0]._id,
      label: allTables[0].views[0].name,
    };
    let table = allTables.find((t) => t._id === tableOfPresetOne.value)!;
    let view = table?.views.find((v) => v._id === viewOfPresetOne.value)!;

    const newPresetActiveState: AppActiveState = {
      activePresetId: pluginPresets[0]._id,
      activePresetIdx: 0,
      activeTable: table,
      activeTableName: table.name,
      activeTableView: view,
      activeViewRows: [],
    };

    setAppActiveState(newPresetActiveState);
  };

  const toggleSettings = () => {
    if (isMobile() && isShowState.isShowPresets) {
      // Collapse presets if open
      togglePresets();
    }

    setIsShowState((prevState) => ({ ...prevState, isShowSettings: !prevState.isShowSettings }));
  };

  const togglePresets = () => {
    if (isMobile() && isShowState.isShowSettings) {
      // Collapse settings if open
      toggleSettings();
    }

    setIsShowState((prevState) => ({ ...prevState, isShowPresets: !prevState.isShowPresets }));
  };

  /**
   * Handles the change of the active table or view, updating the application state and presets accordingly.
   */
  const onTableOrViewChange = (type: SettingsOption, option: SelectOption) => {
    let _activeViewRows: TableRow[];
    let updatedPluginPresets: PresetsArray;

    switch (type) {
      case 'table':
        const _activeTable = allTables.find((s) => s._id === option.value)!;
        _activeViewRows = window.dtableSDK.getViewRows(_activeTable.views[0], _activeTable);
        setActiveTableViews(_activeTable.views);
        setAppActiveState((prevState) => ({
          ...prevState,
          activeTable: _activeTable,
          activeTableName: _activeTable.name,
          activeTableView: _activeTable.views[0],
          activeViewRows: _activeViewRows,
          activeRelationship: getDefaultLinkColumn(_activeTable),
        }));

        updatedPluginPresets = pluginPresets.map((preset) =>
          preset._id === activePresetId
            ? {
                ...preset,
                settings: {
                  ...preset.settings,
                  relationship: getDefaultLinkColumn(_activeTable),
                  selectedTable: { value: _activeTable._id, label: _activeTable.name },
                  selectedView: {
                    value: _activeTable.views[0]._id,
                    label: _activeTable.views[0].name,
                  },
                },
              }
            : preset
        );
        break;

      case 'view':
        let _activeTableView =
          activeTableViews.find((s) => s._id === option.value) || activeTableViews[0];
        _activeViewRows = window.dtableSDK.getViewRows(_activeTableView, activeTable);
        setAppActiveState((prevState) => ({
          ...prevState,
          activeTableView: _activeTableView,
          activeViewRows: _activeViewRows,
        }));

        updatedPluginPresets = pluginPresets.map((preset) =>
          preset._id === activePresetId
            ? {
                ...preset,
                settings: {
                  ...preset.settings,
                  selectedView: { value: _activeTableView._id, label: _activeTableView.name },
                },
              }
            : preset
        );
        break;
    }

    setPluginPresets(updatedPluginPresets);
    updatePluginDataStore({ ...pluginDataStore, presets: updatedPluginPresets });
  };

  function handleRelationships(r: any) {
    setActiveRelationships(r);
    const currentData = window.dtableSDK.getPluginSettings(PLUGIN_NAME) || pluginDataStore;
    const updatedPresets = currentData.presets.map((preset: any) => {
      if (preset._id === appActiveState.activePresetId) {
        return {
          ...preset,
          customSettings: {
            ...preset.customSettings,
            relationship: r,
          },
        };
      }
      return preset;
    });

    window.dtableSDK.updatePluginSettings(PLUGIN_NAME, {
      ...currentData,
      presets: updatedPresets,
    });
  }

  function handleTableDisplays(t: any) {
    setActiveTableDisplay(t);
    const currentData = window.dtableSDK.getPluginSettings(PLUGIN_NAME) || pluginDataStore;
    const updatedPresets = currentData.presets.map((preset: any) => {
      if (preset._id === appActiveState.activePresetId) {
        return {
          ...preset,
          customSettings: {
            ...preset.customSettings,
            tableDisplay: t,
          },
        };
      }
      return preset;
    });

    window.dtableSDK.updatePluginSettings(PLUGIN_NAME, {
      ...currentData,
      presets: updatedPresets,
    });
  }

  if (!isShowPlugin) {
    return null;
  }

  return isLoading ? (
    <div></div>
  ) : (
    <ReactFlowProvider>
      <div
        style={{ display: isShowWaiting ? 'flex' : 'none' }}
        className="wait-fs-modal"
        onClick={(e) => {
          setIsShowState({ ...isShowState, isShowWaiting: false });
        }}>
        <div className="ldr simple-circle"></div>
      </div>
      <ResizableWrapper>
        {/* presets  */}
        <PluginPresets
          appActiveState={appActiveState}
          allTables={allTables}
          pluginPresets={pluginPresets}
          activePresetIdx={activePresetIdx}
          pluginDataStore={pluginDataStore}
          isShowPresets={isShowPresets}
          onTogglePresets={togglePresets}
          onToggleSettings={toggleSettings}
          onSelectPreset={onSelectPreset}
          updatePresets={updatePresets}
          updateActiveData={updateActiveData}
          isShowState={isShowState}
          setIsShowState={setIsShowState}
        />
        <div className={styles.plugin}>
          <Header
            presetName={findPresetName(pluginPresets, activePresetId)}
            isShowPresets={isShowPresets}
            isShowSettings={isShowSettings}
            onTogglePresets={togglePresets}
            toggleSettings={toggleSettings}
            togglePlugin={onPluginToggle}
            appActiveState={appActiveState}
            pluginDataStore={pluginDataStore}
          />
          {/* main body  */}
          <div
            className="d-flex position-relative"
            style={{ height: 'calc(100% - 50px)', width: '100%', backgroundColor: '#f5f5f5' }}>
            <div id={PLUGIN_NAME} className={styles.body} style={{ padding: '10px', flex: '1' }}>
              {/* Note: The CustomPlugin component serves as a placeholder and should be replaced with your custom plugin component. */}
              <PluginTR
                appActiveState={appActiveState}
                allTables={allTables}
                pluginDataStore={pluginDataStore}
                activeRelationships={activeRelationships}
                activeTableDisplay={activeTableDisplay}
                setPluginDataStore={setPluginDataStore}
                // onPreviewHeaderColor={setPreviewHeaderColor}
                previewHeaderColor={previewHeaderColor}
              />
            </div>

            <PluginSettings
              activeComponents={activeComponents}
              isShowSettings={isShowSettings}
              allTables={allTables}
              appActiveState={appActiveState}
              activeTableViews={activeTableViews}
              pluginPresets={pluginPresets}
              onTableOrViewChange={onTableOrViewChange}
              onToggleSettings={toggleSettings}
              activeRelationships={activeRelationships}
              handleRelationships={handleRelationships}
              activeTableDisplay={activeTableDisplay}
              handleTableDisplays={handleTableDisplays}
              onPreviewHeaderColor={setPreviewHeaderColor}
              previewHeaderColor={previewHeaderColor}
            />
          </div>
        </div>
      </ResizableWrapper>
    </ReactFlowProvider>
  );
};

export default App;
