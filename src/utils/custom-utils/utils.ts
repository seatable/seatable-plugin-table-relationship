import { LINK_TYPE } from '../custom-constants/constants';
import {
  ILinksColumnData,
  ILinksData,
  ISrcFrstTblId,
  NodeResultItem,
} from '../custom-interfaces/ERDPlugin';
import { TableArray, TableColumn } from '../template-interfaces/Table.interface';
import { MarkerType, Edge } from 'reactflow';

export function generateLinks(allTables: TableArray): ILinksData[] {
  const formulaCc: TableColumn[] = []; // Column 'link' type
  const linkCc: ILinksColumnData[] = []; // Column 'link-formula' type

  allTables.forEach((t) => {
    t.columns.forEach((c) => {
      if (c.type === LINK_TYPE.link) {
        linkCc.push({
          table_id: t._id,
          table_name: t.name,
          column_key: c.key,
          column_name: c.name,
          srcT: c.data.table_id,
          tgtT: c.data.other_table_id,
          link_id: c.data.link_id,
        });
      } else if (c.type === LINK_TYPE.formula) {
        formulaCc.push(c);
      }
    });
  });

  const lCcData: ILinksData[] = reduceLinkCcData(linkCc); // Column 'link' Data for Link
  const fCcData: ILinksData[] = createFormulaCcData(formulaCc, allTables); // Column 'link-formula' Data for Link

  return [...lCcData, ...fCcData];
}

export function generateNodes(allTables: TableArray): NodeResultItem[] {
  const numRows: number = 5;
  const numCols: number = 5;

  const ns: NodeResultItem[] = [];

  for (let i = 0; i < allTables.length; i++) {
    const table = allTables[i];
    const info = table.columns.map((cl) => ({ key: cl.key, type: cl.type, name: cl.name }));

    // Calculate position
    const rowIndex = Math.floor(i / numCols);
    const colIndex = i % numCols;
    const x = 100 + colIndex * 250;
    const y = 100 + rowIndex * 250;

    const activeNode: NodeResultItem = {
      id: table._id.toString(),
      type: 'custom',
      position: { x, y },
      data: {
        name: table.name.toString(),
        columns: info,
        position: { x, y },
      },
    };

    ns.push(activeNode);
  }

  return ns;
}

export function generateEdges(links: ILinksData[], ns: NodeResultItem[]): Edge[] {
  const es: Edge[] = [];
  let sourceHandle = '';
  let targetHandle = '';

  links.forEach((link, index) => {
    const { sourceData, targetData1st, type } = link;

    const sourceTbl = sourceData.table_id;
    const targetTbl = targetData1st.table_id;
    const sourceNode = ns.find((n) => n.id === sourceTbl);
    const targetNode = ns.find((n) => n.id === targetTbl);

    let color: string;
    switch (type) {
      case LINK_TYPE.link:
        color = '#000';
        break;
      case LINK_TYPE.formula:
        color = '#ff8000';
        break;
      case LINK_TYPE.formula2nd:
        color = '#ADD8E6';
        break;
      default:
        color = '#000';
        break;
    }
    if (sourceNode && targetNode) {
      let src = {
        tId: sourceNode.id,
        cId: sourceData.column_key,
        edgSide: sourceNode.position.x > targetNode.position.x ? 'l' : 'r',
        suffix: '-src',
      };
      let tgt = {
        tId: targetNode.id,
        cId: targetData1st.column_key,
        edgSide: sourceNode.position.x < targetNode.position.x ? 'l' : 'r',
        suffix: '-tgt',
      };

      sourceHandle = `${src.tId}_${src.cId}_${src.edgSide}${src.suffix}`;
      targetHandle = `${tgt.tId}_${tgt.cId}_${tgt.edgSide}${tgt.suffix}`;
    }

    if (sourceTbl && targetTbl) {
      es.push({
        id: String(es.length),
        source: sourceTbl,
        target: targetTbl,
        sourceHandle: sourceHandle,
        targetHandle: targetHandle,
        type: 'simplebezier',
        style: {
          strokeWidth: 1,
          stroke: color,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 10,
          height: 10,
          color: color,
        },
      });
    }
  });

  return es;
}

// Helper for generateLinks
// Finding the data for the source and target of the link
function findData(tableKey: string, columnKey: string, allTables: TableArray) {
  let result: ILinksColumnData = {
    column_key: '',
    column_name: '',
    table_id: '',
    table_name: '',
  };
  allTables.forEach((t) => {
    if (t._id === tableKey) {
      t?.columns.forEach((c: TableColumn) => {
        if (c.key === columnKey) {
          result = {
            column_key: c.key,
            column_name: c.name,
            table_id: t._id,
            table_name: t.name,
          };
        }
      });
    }
  });

  return result;
}

function findSourceAndFirstLinkedTableId(key: string, allTables: TableArray) {
  let result: ISrcFrstTblId = { firstLinkTableId: '', sourceTableId: '' };
  allTables.forEach((t) => {
    t.columns.forEach((c) => {
      if (c.key === key) {
        result = { firstLinkTableId: c.data.other_table_id, sourceTableId: t._id };
      }
    });
  });
  return result;
}

function findSecondLinkedTableId(tableKey: string, columnKey: string, allTables: TableArray) {
  let targetColumns: TableColumn[] = [];
  let result: string = '';
  allTables.forEach((t) => {
    if (t._id === tableKey) {
      targetColumns = t.columns;
    }
  });
  targetColumns?.forEach((c: TableColumn) => {
    if (c.key === columnKey) {
      result = c.data.other_table_id;
    }
  });

  return result;
}

function reduceLinkCcData(linkCc: ILinksColumnData[]) {
  const groupedItems: {
    [key: string]: { sourceData: ILinksColumnData | null; targetData: ILinksColumnData | null };
  } = {};
  linkCc.forEach((item) => {
    if (item.link_id && !groupedItems[item.link_id]) {
      groupedItems[item.link_id] = { sourceData: null, targetData: null };
    }

    if (item.link_id && item.table_id === item.srcT) {
      groupedItems[item.link_id].sourceData = item;
    } else if (item.link_id && item.table_id === item.tgtT) {
      groupedItems[item.link_id].targetData = item;
    }
  });

  let filteredData: {
    [linkId: string]: {
      sourceData: ILinksColumnData;
      targetData: ILinksColumnData;
    };
  } = {};

  for (let key in groupedItems) {
    if (Object.prototype.hasOwnProperty.call(groupedItems, key)) {
      filteredData[key] = {
        sourceData: groupedItems[key].sourceData!,
        targetData: groupedItems[key].targetData!,
      };
    }
  }

  const filteredDataResult = Object.values(filteredData).map(
    (g: { sourceData: ILinksColumnData; targetData: ILinksColumnData }) => {
      return {
        type: LINK_TYPE.link,
        sourceData: g.sourceData,
        targetData1st: g.targetData,
      };
    }
  );

  return filteredDataResult;
}

function createFormulaCcData(data: TableColumn[], allTables: TableArray) {
  let fCcData: ILinksData[] = [];
  const fCcRowData = data.map((fc: TableColumn) => {
    let secondLinkedTableId: string | undefined;
    const { sourceTableId, firstLinkTableId } = findSourceAndFirstLinkedTableId(
      fc.data.link_column_key,
      allTables
    );

    if (firstLinkTableId && fc.data.level2_linked_table_column_key !== null) {
      secondLinkedTableId = findSecondLinkedTableId(
        firstLinkTableId,
        fc.data.level1_linked_table_column_key,
        allTables
      );
    }

    if (fc.data.level2_linked_table_column_key !== null) {
      return {
        type: fc.type,
        sourceData: findData(sourceTableId, fc.key, allTables),
        targetData1st: findData(
          firstLinkTableId,
          fc.data.level1_linked_table_column_key,
          allTables
        ),
        targetData2nd: findData(
          secondLinkedTableId!,
          fc.data.level2_linked_table_column_key,
          allTables
        ),
      };
    } else {
      return {
        type: fc.type,
        sourceData: findData(sourceTableId, fc.key, allTables),
        targetData1st: findData(
          firstLinkTableId,
          fc.data.level1_linked_table_column_key,
          allTables
        ),
      };
    }
  });

  fCcRowData.forEach((fc: ILinksData) => {
    fCcData.push({
      type: fc.targetData2nd ? LINK_TYPE.formula2nd : LINK_TYPE.formula,
      sourceData: fc.sourceData,
      targetData1st: fc.targetData1st,
    });

    if (fc.targetData2nd) {
      fCcData.push({
        type: LINK_TYPE.formula2nd,
        sourceData: fc.targetData1st,
        targetData1st: fc.targetData2nd,
      });
    }
  });
  // console.log('fCcData', fCcData);
  fCcData = fCcData.filter(
    (i: ILinksData) =>
      Object.prototype.hasOwnProperty.call(i, 'sourceData') && i.sourceData !== undefined
  );

  return fCcData;
}
