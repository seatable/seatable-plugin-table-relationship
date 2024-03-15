import { AppActiveState } from '../template-interfaces/App.interface';
import { PresetsArray } from '../template-interfaces/PluginPresets/Presets.interface';
import { TableRow } from '../template-interfaces/Table.interface';

export interface IERDPluginProps {
  pluginPresets: PresetsArray;
  appActiveState: AppActiveState;
  activeViewRows?: TableRow[];
}
