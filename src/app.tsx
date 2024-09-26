/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { FaPlus } from 'react-icons/fa6';
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
  TableColumn,
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
  createDefaultPluginDataStore,
  fetchMetaData,
  findPresetName,
  getActiveStateSafeGuard,
  getActiveTableAndActiveView,
  getDefaultLinkColumn,
  getPluginDataStore,
  isMobile,
  parsePluginDataToActiveState,
} from './utils/template-utils/utils';
import { SettingsOption } from './utils/types';
import pluginContext from './plugin-context';
import { ReactFlowProvider } from 'reactflow';
import { RelationshipState } from './utils/custom-interfaces/PluginTR';
import intl from 'react-intl-universal';
import { AVAILABLE_LOCALES, DEFAULT_LOCALE } from './locale';

const App: React.FC<IAppProps> = (props) => {
  const { isDevelopment, lang } = props;
  const { [DEFAULT_LOCALE]: d } = AVAILABLE_LOCALES;

  // Boolean state to show/hide the plugin's components
  const [isShowState, setIsShowState] = useState<AppIsShowState>(INITIAL_IS_SHOW_STATE);
  const { isShowPlugin, isShowSettings, isLoading, isShowPresets } = isShowState;
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
    lkRel: true,
    lk2Rel: true,
    tblNoLnk: true,
  });
  // Destructure properties from the app's active state for easier access
  const { activeTable, activePresetId, activePresetIdx } = appActiveState;
  const { collaborators } = window.app.state;
  const [loading, setLoading] = useState(true); // Add a loading state
  let __allTables: any;

  useEffect(() => {
    initPluginDTableData(isDevelopment ?? false);
    return () => {
      unsubscribeLocalDtableChanged();
      unsubscribeRemoteDtableChanged();
    };
  }, []);

  useEffect(() => {
    if (isMobile()) {
      setIsShowState((prevState) => ({ ...prevState, isShowPresets: false }));
    }
  }, []);

  const initPluginDTableData = async (isDevelopment: boolean) => {
    const metadata = await fetchMetaData(isDevelopment);
    __allTables = metadata.tables;
    setAllTables(metadata.tables);
    setLoading(false);

    // Execute the second part of your code when the data is ready
    if (isDevelopment) {
      // Local development
      window.dtableSDK.subscribe('dtable-connect', () => {
        onDTableConnect(__allTables);
      });
    }

    // Subscribe to table change events
    unsubscribeLocalDtableChanged = window.dtableSDK.subscribe('local-dtable-changed', async () => {
      const metadata = await fetchMetaData(isDevelopment);
      __allTables = metadata.tables;
      setAllTables(metadata.tables);
      onDTableChanged(__allTables);
    });
    unsubscribeRemoteDtableChanged = window.dtableSDK.subscribe(
      'remote-dtable-changed',
      async () => {
        onDTableChanged(__allTables);
      }
    );

    resetData(metadata.tables);
  };

  let unsubscribeLocalDtableChanged = () => {
    throw new Error('Method not implemented.');
  };
  let unsubscribeRemoteDtableChanged = () => {
    throw new Error('Method not implemented.');
  };

  const onDTableConnect = (res: TableArray) => {
    resetData(res);
  };
  const onDTableChanged = (res: TableArray) => {
    resetData(res);
  };

  const resetData = (responseTables: TableArray) => {
    const activeTable = responseTables[0];
    let activeTableViews: TableViewArray = activeTable.views; // All the Views of the specific Active Table
    let pluginDataStore: IPluginDataStore = getPluginDataStore(activeTable, PLUGIN_NAME);
    let pluginPresets: PresetsArray = pluginDataStore.presets; // An array with all the Presets

    setActiveComponents((prevState) => ({
      ...prevState,
      settingsDropDowns: info.active_components.settings_dropdowns,
      add_row_button: info.active_components.add_row_button,
    }));
    setPluginDataStore(pluginDataStore);
    setAllTables(responseTables);
    setPluginPresets(pluginPresets);
    const localActivePresetId = localStorage.getItem(ACTIVE_PRESET_ID);
    setIsShowState((prevState) => ({ ...prevState, isLoading: false }));

    if (localActivePresetId) {
      const appActiveState = parsePluginDataToActiveState(
        pluginDataStore,
        pluginPresets,
        responseTables
      );

      onSelectPreset(localActivePresetId, appActiveState);
      const activePresetRelationship = pluginPresets.find((p) => {
        return p._id === localActivePresetId;
      })?.customSettings?.relationship;
      if (activePresetRelationship) {
        setActiveRelationships(activePresetRelationship);
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
      const activeViewRows: TableRow[] = window.dtableSDK.getViewRows(
        activeTableAndView?.view || activeTableViews[0],
        activeTableAndView?.table || activeTable
      );

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
      setAppActiveState(updatedActiveState);
    } else {
      const activePreset = pluginPresets.find((preset) => preset._id === presetId);
      console.log({ activePreset });
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
      console.log({ updatedActiveState });
      updatePluginDataStore({
        ...pluginDataStore,
        activePresetId: presetId,
        activePresetIdx: _activePresetIdx,
      });
      setAppActiveState(updatedActiveState);
    }

    setActiveTableViews(updatedActiveTableViews);
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
    setAppActiveState((prevState) => ({
      ...prevState,
      activePresetIdx: _activePresetIdx,
    }));
    setPluginPresets(updatedPresets);
    setPluginDataStore(pluginDataStore);
    updatePluginDataStore(_pluginDataStore);
  };

  // Update plugin data store (old plugin settings)
  const updatePluginDataStore = (pluginDataStore: IPluginDataStore) => {
    console.log('updatePluginDataStore', pluginDataStore);
    window.dtableSDK.updatePluginSettings(PLUGIN_NAME, pluginDataStore);
  };

  /**
   * Updates the active data based on the settings of the first preset.
   * Retrieves table and view information from the first preset's settings, fetches the corresponding
   * data from the available tables, and updates the active state accordingly.
   */
  const updateActiveData = () => {
    let allTables: TableArray = window.dtableSDK.getTables();
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
      activeViewRows: window.dtableSDK.getViewRows(view, table),
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

  const getInsertedRowInitData = (view: TableView, table: Table, rowID: string) => {
    return window.dtableSDK.getInsertedRowInitData(view, table, rowID);
  };

  // functions for add row functionality
  const onAddItem = (view: TableView, table: Table, rowID: string) => {
    let rowData = getInsertedRowInitData(view, table, rowID);
    onInsertRow(table, view, rowData);
  };

  const addRowItem = () => {
    if (isDevelopment) {
      return;
    }

    let rows = appActiveState.activeViewRows;
    if (rows) {
      let row_id = rows.length > 0 ? rows[rows.length - 1]._id : '';
      onAddItem(appActiveState.activeTableView!, appActiveState.activeTable!, row_id);
    }
  };

  const onInsertRow = (table: Table, view: TableView, rowData: any) => {
    let columns = window.dtableSDK.getColumns(table);
    let newRowData: { [key: string]: any } = {};

    for (let key in rowData) {
      let column = columns.find((column: TableColumn) => column.name === key);

      if (!column) {
        continue;
      }
      switch (column.type) {
        case 'single-select': {
          newRowData[column.name] =
            column.data.options.find((item: any) => item.name === rowData[key])?.name || '';
          break;
        }
        case 'multiple-select': {
          let multipleSelectNameList: any[] = [];
          rowData[key].forEach((multiItemId: any) => {
            let multiSelectItemName = column.data.options.find(
              (multiItem: any) => multiItem.id === multiItemId
            );
            if (multiSelectItemName) {
              multipleSelectNameList.push(multiSelectItemName.name);
            }
          });
          newRowData[column.name] = multipleSelectNameList;
          break;
        }
        default:
          newRowData[column.name] = rowData[key];
      }
    }

    let row_data = { ...newRowData };
    window.dtableSDK.appendRow(table, row_data, view);
    let viewRows = window.dtableSDK.getViewRows(view, table);
    let insertedRow = viewRows[viewRows.length - 1];
    if (insertedRow) {
      pluginContext.expandRow(insertedRow, table);
    }
  };

  function handleRelationships(r: any) {
    setActiveRelationships(r);
    const updatedPresets = pluginDataStore.presets.map((preset) => {
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
      ...pluginDataStore,
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
      <ResizableWrapper>
        {/* presets  */}
        <PluginPresets
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
        />
        <div className={styles.plugin}>
          <Header
            presetName={findPresetName(pluginPresets, activePresetId)}
            isShowPresets={isShowPresets}
            isShowSettings={isShowSettings}
            onTogglePresets={togglePresets}
            toggleSettings={toggleSettings}
            togglePlugin={onPluginToggle}
          />
          {/* main body  */}
          <div
            className="d-flex position-relative"
            style={{ height: '94%', width: '100%', backgroundColor: '#f5f5f5' }}>
            <div
              id={PLUGIN_NAME}
              className={styles.body}
              style={{ padding: '10px', width: '100%' }}>
              {/* Note: The CustomPlugin component serves as a placeholder and should be replaced with your custom plugin component. */}
              <PluginTR
                appActiveState={appActiveState}
                allTables={allTables}
                pluginDataStore={pluginDataStore}
                activeRelationships={
                  pluginPresets[activePresetIdx].customSettings?.relationship || activeRelationships
                }
                setPluginDataStore={setPluginDataStore}
              />

              {activeComponents.add_row_button && (
                <button className={styles.add_row} onClick={addRowItem}>
                  <FaPlus size={30} color="#fff" />
                  {isDevelopment && (
                    <div style={{ margin: 0 }} className={styles.add_row_toolTip}>
                      <p>{intl.get('add_row').d(`${d.add_row}`)}</p>
                    </div>
                  )}
                </button>
              )}
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
            />
          </div>
        </div>
      </ResizableWrapper>
    </ReactFlowProvider>
  );
};

export default App;
