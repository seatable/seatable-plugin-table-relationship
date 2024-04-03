import { EdgeResultItem, Link, NodeResultItem } from '../Interfaces/custom-interfaces/ERDPlugin';
import { TableArray } from '../Interfaces/template-interfaces/Table.interface';

export function generateNodes(allTables: TableArray): NodeResultItem[] {
  const ns: NodeResultItem[] = allTables?.map((table, index) => {
    const info = table.rows.map((row) => {
      return { id: row._id, value: row['0000'] };
    });
    const activeNode = {
      id: table.name.toString(),
      type: 'custom',
      position: { x: 100 + index * 250, y: 200 + index * 100 },
      data: {
        rows: info,
      },
    };
    return activeNode;
  });
  return ns;
}

export function generateEdges(links: Link[], tables: TableArray): EdgeResultItem[] {
  const result: EdgeResultItem[] = [];

  links.forEach((link, index) => {
    const table2 = tables.find((table) => table._id === link.table2_id);
    const table1 = link.table1_id ? tables.find((table) => table._id === link.table1_id) : table2;

    const source = table2 ? table2.name : '';
    const target = table1 ? table1.name : source;

    if (link.table2_table1_map) {
      Object.entries(link.table2_table1_map).forEach(([sourceHandle, targetHandles]) => {
        targetHandles.forEach((targetHandle) => {
          result.push({
            id: String(result.length),
            source,
            target,
            sourceHandle,
            targetHandle,
            type: 'smoothstep',
          });
        });
      });
    }

    if (link.table1_table2_map) {
      Object.entries(link.table1_table2_map).forEach(([targetHandle, sourceHandles]) => {
        sourceHandles.forEach((sourceHandle) => {
          result.push({
            id: String(result.length),
            source: target,
            target: source,
            sourceHandle,
            targetHandle,
            type: 'smoothstep',
          });
        });
      });
    }
  });

  return result;
}
