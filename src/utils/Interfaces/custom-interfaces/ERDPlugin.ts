import { AppActiveState } from '../template-interfaces/App.interface';
import { PresetsArray } from '../template-interfaces/PluginPresets/Presets.interface';
import { TableArray, TableRow } from '../template-interfaces/Table.interface';

interface IERDPluginProps {
  allTables?: TableArray;
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
  _id: string;
  table1_id?: string;
  table2_id: string;
  table1_table2_map?: Record<string, string[]>;
  table2_table1_map: Record<string, string[]>;
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

interface Relationship {
  id: string;
  node1: {
    title: string;
    attrKey: string;
  };
  node2: {
    title: string;
    attrKey: string;
  };
}

interface EntityCoordinates {
  title: string;
  attrKey: string;
  x: number;
  y: number;
}

interface LineCoordinate {
  line_id: string;
  node1: {
    title: string;
    attrKey: string;
    x1: number;
    y1: number;
  };
  node2: {
    title: string;
    attrKey: string;
    x2: number;
    y2: number;
  };
}

enum Position {
  Left = 'left',
  Top = 'top',
  Right = 'right',
  Bottom = 'bottom',
}

type NodeProps<T = any> = {
  id: string;
  data: T;
  dragHandle?: boolean;
  type?: string;
  selected?: boolean;
  isConnectable?: boolean;
  zIndex?: number;
  xPos: number;
  yPos: number;
  dragging: boolean;
  targetPosition?: Position;
  sourcePosition?: Position;
};

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  handleId: string;
  nodeId: string;
}

interface CustomNodeProps {
  id: string;
  data: {
    rows: Record<string, string>;
  };
}

interface EdgeResultItem {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  type: string;
}

interface NodeResultItem {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    rows: {
      id: string;
      value: string | number | any[];
    }[];
  };
}

interface RelationshipState {
  recRel: boolean;
  lkRel: boolean;
}

export type {
  IERDPluginProps,
  Node,
  Link,
  Rectangle,
  Entity,
  Relationship,
  EntityCoordinates,
  LineCoordinate,
  NodeProps,
  Option,
  SelectProps,
  CustomNodeProps,
  EdgeResultItem,
  NodeResultItem,
  RelationshipState,
};
