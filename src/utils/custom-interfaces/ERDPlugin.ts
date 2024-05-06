import { AppActiveState, IPluginDataStore } from '../template-interfaces/App.interface';
import { TableArray } from '../template-interfaces/Table.interface';

interface IERDPluginProps {
  appActiveState: AppActiveState;
  pluginDataStore: IPluginDataStore;
  allTables: TableArray;
  relationship: RelationshipState;
  nodes?: Node[];
  links?: Link[];
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
  recRel: boolean;
  lkRel: boolean;
  lk2Rel: boolean;
  tblNoLinks: boolean;
}

interface NodeResultItem {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    name: string;
    selected?: boolean;
    position: {
      x: number;
      y: number;
    };
    columns: {
      key: string;
      name: string;
      type: string;
      isMultiple: boolean;
    }[];
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
  srcT?: string;
  tgtT?: string;
  link_id?: string;
  isMultiple?: boolean;
}

interface ILinksData {
  type: string;
  sourceData: ILinksColumnData;
  targetData1st: ILinksColumnData;
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

export type {
  IERDPluginProps,
  ITableVisualizationProps,
  Link,
  NodeResultItem,
  RelationshipState,
  nodeCts,
  INodePositions,
  ILinksColumnData,
  ILinksData,
  srcOrTgtData,
  ISrcFrstTblId,
};
