import { SettingsOption } from '../../types';
import { RelationshipState } from '../custom-interfaces/ERDPlugin';
import { AppActiveState } from './App.interface';
import { PresetSettings, PresetsArray } from './PluginPresets/Presets.interface';
import { TableArray, TableViewArray } from './Table.interface';

interface IPluginSettingsProps {
  allTables: TableArray;
  appActiveState: AppActiveState;
  activeTableViews: TableViewArray;
  pluginPresets: PresetsArray;
  onTableOrViewChange: (type: SettingsOption, option: SelectOption) => void;
  onToggleSettings: () => void;
  isShowSettings: boolean;
  relationship: RelationshipState;
  setRelationship: (t: any) => void;
}

interface SelectOption {
  value: string; // item._id
  label: string; // item.name
}

interface IActivePresetSettings extends PresetSettings {
  activePresetId: string;
}

export type { IPluginSettingsProps, SelectOption, IActivePresetSettings };
