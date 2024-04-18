import { EdgeResultItem, NodeResultItem } from '../Interfaces/custom-interfaces/ERDPlugin';
import { TableArray, TableColumn } from '../Interfaces/template-interfaces/Table.interface';
import { MarkerType } from 'reactflow';

export function generateLinks(allTables: TableArray) {
  const tableInfoFiltered: any[] = [];
  const allColumns: TableColumn[] = [];

  allTables.forEach((t) => {
    t.columns.reduce((accumulator: any[], column) => {
      if (column.type === 'link-formula') {
        for (let i = 0; i < allTables.length; i++) {
          const table = allTables[i];
          const cc: any = table.columns.find(
            (c) => c.key === column.data.level1_linked_table_column_key
          );
          if (cc) {
            const srcFilteredObject = {
              _id: t._id,
              name: t.name,
              columns: [
                {
                  key: column.key,
                  type: column.type,
                  name: column.name,
                  data_table_id: t._id, // Source Table
                  data_other_table_id: table._id, // Target Table
                  data_link_id: column.key,
                },
              ],
            };
            const tgtFilteredObject = {
              _id: table._id,
              name: table.name,
              columns: [
                {
                  key: cc.key,
                  type: column.type,
                  name: table.name,
                  data_table_id: t._id, // Source Table
                  data_other_table_id: table._id, // Target Table
                  data_link_id: column.key,
                },
              ],
            };

            tableInfoFiltered.push(srcFilteredObject, tgtFilteredObject);
          }
        }
      }
      if (column.type === 'link') {
        const { data } = column;
        const { table_id, other_table_id } = data;
        if (table_id !== other_table_id || data.formula === 'lookup') {
          const { key, type, name, data } = column;
          const { table_id, other_table_id, link_id } = data;
          const filteredObject = {
            _id: t._id,
            name: t.name,
            columns: [
              {
                key,
                type,
                name,
                data_table_id: table_id, // Source Table
                data_other_table_id: other_table_id, // Target Table
                data_link_id: link_id,
              },
            ],
          };
          tableInfoFiltered.push(filteredObject);
        }
      }
      return accumulator;
    }, []);
  });

  const onlyTablesWithLinksColumn = tableInfoFiltered.filter((i) => i.columns.length > 0);

  onlyTablesWithLinksColumn.forEach((t: any) => {
    const columnsWithTableInfo = t.columns.map((column: any) => ({
      type: column.type,
      link_id: column.data_link_id,
      column_key: column.key,
      column_name: column.name,
      dataTableId: t._id,
      sourceTable_id: column.data_table_id === t._id ? t._id : column.data_table_id,
      targetTable_id: column.data_other_table_id === t._id ? t._id : column.data_other_table_id,
      table_name: t.name,
    }));
    allColumns.push(...columnsWithTableInfo);
  });

  const links = Object.values(
    allColumns.reduce((a: { [key: string]: any }, c: any) => {
      if (c.dataTableId === c.sourceTable_id) {
        a[c.link_id] = a[c.link_id] || { ...c };
        a[c.link_id].sourceColumn_key = c.column_key;
        a[c.link_id].sourceColumn_name = c.column_name;
        a[c.link_id].sourceTable_name = c.table_name;
        delete a[c.link_id].column_key;
        delete a[c.link_id].column_name;
        delete a[c.link_id].dataTableId;
        delete a[c.link_id].table_name;
      } else if (c.dataTableId === c.targetTable_id) {
        a[c.link_id] = a[c.link_id] || { ...c };
        a[c.link_id].targetColumn_key = c.column_key;
        a[c.link_id].targetColumn_name = c.column_name;
        a[c.link_id].targetTable_name = c.table_name;
        delete a[c.link_id].dataTableId;
        delete a[c.link_id].table_name;
        delete a[c.link_id].column_key;
        delete a[c.link_id].column_name;
      }
      return a;
    }, {})
  );

  return links;
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
    const sourceTbl = link.sourceTable_name;
    const targetTbl = link.targetTable_name;
    const sourceNode = ns.find((n) => n.id === sourceTbl);
    const targetNode = ns.find((n) => n.id === targetTbl);

    if (sourceNode && targetNode) {
      sourceHandle = `${sourceNode.id}_${link.sourceColumn_key}_${
        sourceNode.position > targetNode.position ? 'l' : 'r'
      }-src`;
      targetHandle = `${targetNode.id}_${link.targetColumn_key}_${
        sourceNode.position > targetNode.position ? 'r' : 'l'
      }-tgt`;
    }

    if (sourceTbl && targetTbl) {
      result.push({
        id: String(result.length),
        source: sourceTbl,
        target: targetTbl,
        sourceHandle: sourceHandle,
        targetHandle: targetHandle,
        type: 'smoothstep',
        style:
          link.type === 'link-formula'
            ? {
                strokeWidth: 1,
                stroke: '#ff8000',
              }
            : {
                strokeWidth: 1,
                stroke: '#000',
              },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 10,
          height: 10,
          color: '#000',
        },
      });
    }
  });

  return result;
}
