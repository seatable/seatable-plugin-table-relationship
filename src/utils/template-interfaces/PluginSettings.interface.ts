import { SettingsOption } from '../types';
import { RelationshipState } from '../custom-interfaces/PluginTR';
import { AppActiveState, IActiveComponents } from './App.interface';
import { PresetSettings, PresetsArray } from './PluginPresets/Presets.interface';
import { TableArray, TableViewArray } from './Table.interface';

interface IPluginSettingsProps {
  onToggleSettings: () => void;
  isShowSettings: boolean;
  activeRelationships: RelationshipState;
  handleRelationships: (t: any) => void;
}

interface SelectOption {
  value: string; // item._id
  label: string; // item.name
}

interface IActivePresetSettings extends PresetSettings {
  activePresetId: string;
}

export type { IPluginSettingsProps, SelectOption, IActivePresetSettings };
