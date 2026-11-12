// External imports
import intl from 'react-intl-universal';
import info from '../../plugin-config/info.json';
// Interfaces
import pluginContext from '../../plugin-context';
import { PresetSettings } from '../template-interfaces/PluginPresets/Presets.interface';
import { AppActiveState, AppIsShowState } from '../template-interfaces/App.interface';
import { IActivePresetSettings } from '../template-interfaces/PluginSettings.interface';

// Constants
const POSSIBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz0123456789';
const DTABLE_UUID = pluginContext.getSetting('dtableUuid');

/**
 * The key the plugin's settings are stored under in the base (and part of
 * ACTIVE_PRESET_ID). It is an identifier, not a label: changing it would orphan
 * every base's presets. Always the English name, whatever the interface language —
 * pluginDisplayName() is the one shown.
 */
const PLUGIN_NAME: string = info.display_name.en;

/**
 * The plugin's name in the interface language (info.json's `display_name`, the same
 * names SeaTable shows in its plugin list). Call it at render time: the locale is set
 * in entry.tsx, after the modules are evaluated.
 */
function pluginDisplayName(): string {
  const names = info.display_name as Record<string, string>;
  const lang = String(intl.getInitOptions().currentLocale || 'en')
    .replace(/_/g, '-')
    .toLowerCase();
  return names[lang] ?? names[lang.split('-')[0]] ?? names.en;
}

const PLUGIN_ID = `${info.name}-component`;

export const ACTIVE_PRESET_ID =
  'localActivePresetId_' + DTABLE_UUID.slice(0, 7) + '_' + PLUGIN_NAME;

// Table and Preset Defaults
const TABLE_NAME = 'table_name';
const DEFAULT_PRESET_NAME = 'New chart';

// Default Select Option
const DEFAULT_SELECT_OPTION = {
  value: '',
  label: '',
};

// Default Preset Settings
const DEFAULT_PRESET_SETTINGS: PresetSettings = {
  shown_image_name: '',
  shown_title_name: '',
  selectedTable: DEFAULT_SELECT_OPTION,
  selectedView: DEFAULT_SELECT_OPTION,
};

// Default Plugin Data
const DEFAULT_PLUGIN_DATA = {
  pluginName: PLUGIN_NAME,
  activePresetId: '0000',
  activePresetIdx: 0,
  presets: [
    {
      _id: '0000',
      name: DEFAULT_PRESET_NAME,
      settings: DEFAULT_PRESET_SETTINGS,
    },
  ],
};

// Preset Handle Actions
const PresetHandleAction = {
  delete: 'delete',
  rename: 'rename',
  duplicate: 'duplicate',
  edit: 'edit',
  new: 'new',
  reset: 'reset',
  export: 'export',
};

// KeyDown Actions
const KeyDownActions = {
  enter: 'Enter',
  escape: 'Escape',
};

// Initial App State
const INITIAL_IS_SHOW_STATE: AppIsShowState = {
  isShowPlugin: true,
  isShowSettings: false,
  isLoading: true,
  isShowPresets: true,
  isShowWaiting: false,
};

const INITIAL_CURRENT_STATE: AppActiveState = {
  activeTable: null,
  activeTableName: 'Table1',
  activeTableView: null,
  activePresetId: '0000',
  activePresetIdx: 0,
};

// Default Selected Preset
const DEFAULT_SELECTED_PRESET: IActivePresetSettings = {
  activePresetId: '',
  selectedTable: DEFAULT_SELECT_OPTION,
  selectedView: DEFAULT_SELECT_OPTION,
};

// Exported Constants
export {
  POSSIBLE,
  PLUGIN_NAME,
  pluginDisplayName,
  PLUGIN_ID,
  TABLE_NAME,
  DEFAULT_PLUGIN_DATA,
  DEFAULT_PRESET_NAME,
  DEFAULT_PRESET_SETTINGS,
  PresetHandleAction,
  KeyDownActions,
  INITIAL_IS_SHOW_STATE,
  INITIAL_CURRENT_STATE,
  DEFAULT_SELECTED_PRESET,
  DEFAULT_SELECT_OPTION,
};
