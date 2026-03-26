import { AppActiveState, IPluginDataStore } from '../template-interfaces/App.interface';
import { TableArray } from '../template-interfaces/Table.interface';

interface IPluginTRProps {
  id?: string;
  appActiveState: AppActiveState;
  pluginDataStore: IPluginDataStore;
  allTables: TableArray;
  nodes?: Node[];
  links?: Link[];
  activeRelationships: RelationshipState;
  activeTableDisplay: TableDisplayState;
  previewHeaderColor?: string | null;
  setPluginDataStore: (t: any) => void;
  // onPreviewHeaderColor: (t: any) => void;
}
interface ITableVisualizationProps {
  appActiveState: AppActiveState;
}

interface Link {
  _id: string;
  table1_id?: string;
  table2_id: string;
  table1_table2_map?: Record<string, string[]>;
  table2_table1_map: Record<string, string[]>;
}

interface RelationshipState {
  // Link to other records relationship
  recRel: boolean;
  recSelfRel: boolean;
  // Link formula relationship
  lkRel: boolean;
  lk2Rel: boolean;
  countLinks: boolean;
  rollup: boolean;
  findmax: boolean;
  findmin: boolean;
  // Tables
  /*tblNoLnk: boolean;
  tblAllCols: boolean;
  isAllShown: boolean;*/
}

interface SelectedViews {
  [key: string]: string;
}

interface StrokeProperties {
  stroke: string;
  strokeWidth: number;
  strokeDasharray: string;
}

interface LinksStrokes {
  link: StrokeProperties;
  formula: StrokeProperties;
  formula2nd: StrokeProperties;
}

interface TableDisplayState {
  displayedTables: Array<string>;
  selectedViews: SelectedViews;
  isAllShown: boolean;
  headerColor: string;
  fontSize: number;
  backgroundColor: string;
  edgeStrokes: LinksStrokes;
  isBackground: boolean;
  tblNoLnk: boolean;
  tblAllCols: boolean;
}

interface PreviewHeaderColorState {
  previewHeaderColor: string;
}

interface NodeResultItem {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  width?: number;
  height?: number;
  hidden: boolean;
  data: {
    name: string;
    selected?: boolean;
    displaced?: boolean;
    hasHiddenLinks?: boolean;
    headerColor: string;
    fontSize: number;
    /*position: {
      x: number;
      y: number;
    };*/
    columns: {
      key: string;
      name: string;
      type: string;
      isMultiple: boolean;
    }[];
  };
  style: {
    fontSize?: string;
  };
}

interface nodeCts {
  n: string;
  cts: number;
}

interface INodePositions {
  [key: string]: {
    x: number;
    y: number;
  };
}

interface ILinksColumnData {
  table_id: string;
  table_name: string;
  column_key: string;
  column_name: string;
  column_idx: number;
  formulaType?: string;
  srcT?: string;
  tgtT?: string;
  link_id?: string;
  isMultiple?: boolean;
}

interface ILinksData {
  type: string;
  sourceData: ILinksColumnData;
  targetData1st: ILinksColumnData;
  formulaType?: string;
  targetData2nd?: ILinksColumnData;
}

interface srcOrTgtData {
  column_key: string;
  column_name: string;
  table_id: string;
  table_name: string;
}

interface ISrcFrstTblId {
  firstLinkTableId: string;
  sourceTableId: string;
}

interface IViewPort {
  x: number;
  y: number;
  zoom: number;
}

type PositionLoggerNodeData = {
  label?: string;
};

export type {
  IPluginTRProps,
  ITableVisualizationProps,
  Link,
  NodeResultItem,
  SelectedViews,
  LinksStrokes,
  StrokeProperties,
  RelationshipState,
  TableDisplayState,
  nodeCts,
  INodePositions,
  ILinksColumnData,
  ILinksData,
  srcOrTgtData,
  ISrcFrstTblId,
  IViewPort,
  PositionLoggerNodeData,
  PreviewHeaderColorState,
};
