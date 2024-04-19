import { EdgeResultItem, NodeResultItem } from '../Interfaces/custom-interfaces/ERDPlugin';
import { TableArray, TableColumn } from '../Interfaces/template-interfaces/Table.interface';
import { MarkerType, clamp } from 'reactflow';
import { LINK_TYPE } from '../constants';

export function generateLinks(allTables: TableArray) {
  const formulaCc: TableColumn[] = [];
  const linkCc: any[] = [];

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
  const lCcData = reduceLindCcData(linkCc);
  const fCcData = createFormulaCcData(formulaCc, allTables);

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
    const y = 100 + rowIndex * 250 + (colIndex % 2 === 0 ? 0 : 100);

    const activeNode: NodeResultItem = {
      id: table.name.toString(),
      type: 'custom',
      position: { x, y },
      data: {
        columns: info,
        position: { x, y },
      },
    };

    ns.push(activeNode);
  }

  return ns;
}

export function generateEdges(links: any[], tables: TableArray, ns: NodeResultItem[]): any[] {
  const result: EdgeResultItem[] = [];
  let sourceHandle = '';
  let targetHandle = '';

  links.forEach((link, index) => {
    const { sourceData, targetData1st, type } = link;

    const sourceTbl = sourceData.table_name;
    const targetTbl = targetData1st.table_name;
    const sourceNode = ns.find((n) => n.id === sourceTbl);
    const targetNode = ns.find((n) => n.id === targetTbl);

    let color;
    switch (type) {
      case 'link':
        color = '#000';
        break;
      case 'link-formula':
        color = '#ff8000';
        break;
      case 'link-formula-2nd':
        color = '#ADD8E6';
        break;
      default:
        color = '#000';
        break;
    }

    if (sourceNode && targetNode) {
      const getSourceOrTargetData = (node: any, data: any, side: string) => ({
        tId: node.id,
        cId: data.column_key,
        edgSide: node.position.x > targetNode.position.x ? 'l' : 'r',
        suffix: side,
      });

      const srcHandleData = getSourceOrTargetData(sourceNode, sourceData, '-src');
      const tgtHandleData = getSourceOrTargetData(targetNode, targetData1st, '-tgt');

      sourceHandle = `${srcHandleData.tId}_${srcHandleData.cId}_${srcHandleData.edgSide}${srcHandleData.suffix}`;
      targetHandle = `${tgtHandleData.tId}_${tgtHandleData.cId}_${tgtHandleData.edgSide}${tgtHandleData.suffix}`;
    }

    if (sourceTbl && targetTbl) {
      result.push({
        id: String(result.length),
        source: sourceTbl,
        target: targetTbl,
        sourceHandle: sourceHandle,
        targetHandle: targetHandle,
        // type: 'bezier',
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

  return result;
}

// Helper for generateLinks

function findData(tableKey: string, columnKey: string, allTables: TableArray) {
  let result;
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
function findFirstLinkedTable(key: string, allTables: TableArray) {
  let result: {
    firstLinkTableId: string;
    sourceTableId: string;
  } = { firstLinkTableId: '', sourceTableId: '' };
  allTables.forEach((t) => {
    t.columns.forEach((c) => {
      if (c.key === key) {
        result = { firstLinkTableId: c.data.other_table_id, sourceTableId: t._id };
      }
    });
  });
  return result;
}

function findSecondLinedTable(tableKey: string, columnKey: string, allTables: TableArray) {
  let targetColumns: any;
  let result;
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

function reduceLindCcData(linkCc: any[]) {
  const groupedItems: { [key: string]: { sourceData: any | null; targetData: any | null } } = {};

  linkCc.forEach((item) => {
    if (!groupedItems[item.link_id]) {
      groupedItems[item.link_id] = { sourceData: null, targetData: null };
    }

    if (item.table_id === item.srcT) {
      groupedItems[item.link_id].sourceData = item;
    } else if (item.table_id === item.tgtT) {
      groupedItems[item.link_id].targetData = item;
    }
  });

  let filteredData: any = {};

  for (let key in groupedItems) {
    if (Object.prototype.hasOwnProperty.call(groupedItems, key)) {
      if (groupedItems[key].targetData !== null) {
        filteredData[key] = groupedItems[key];
      }
    }
  }

  const resultArray = Object.values(filteredData).map((g: any) => {
    return {
      type: 'link',
      sourceData: g.sourceData,
      targetData1st: g.targetData,
    };
  });
  return resultArray;
}

function createFormulaCcData(data: any, allTables: TableArray) {
  const fCcData: any = [];
  const fCcRowData = data.map((fc: any) => {
    let secondLinkedTableId: string | undefined;
    const { sourceTableId, firstLinkTableId } = findFirstLinkedTable(
      fc.data.link_column_key,
      allTables
    );

    if (firstLinkTableId && fc.data.level2_linked_table_column_key !== null) {
      secondLinkedTableId = findSecondLinedTable(
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

  fCcRowData.forEach((fc: any) => {
    fCcData.push({
      type: fc.targetData2nd ? 'link-formula-2nd' : 'link-formula',
      sourceData: fc.sourceData,
      targetData1st: fc.targetData1st,
    });

    if (fc.targetData2nd) {
      fCcData.push({
        type: 'link-formula-2nd',
        sourceData: fc.targetData1st,
        targetData1st: fc.targetData2nd,
      });
    }
  });

  return fCcData;
}
