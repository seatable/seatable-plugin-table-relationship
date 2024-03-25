import { AppActiveState } from '../template-interfaces/App.interface';
import { PresetsArray } from '../template-interfaces/PluginPresets/Presets.interface';
import { TableRow } from '../template-interfaces/Table.interface';

interface IERDPluginProps {
  entities: Entity[];
  pluginPresets?: PresetsArray;
  appActiveState?: AppActiveState;
  activeViewRows?: TableRow[];
  nodes?: Node[];
  links?: Link[];
}

interface Node {
  id: string;
}

interface Link {
  source: string;
  target: string;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Entity {
  eTitle: string;
  eAttributes: { [key: string]: string };
}

export type { IERDPluginProps, Node, Link, Rectangle, Entity };
