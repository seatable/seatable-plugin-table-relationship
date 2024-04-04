import { EdgeResultItem, Link, NodeResultItem } from '../Interfaces/custom-interfaces/ERDPlugin';
import { TableArray } from '../Interfaces/template-interfaces/Table.interface';
import { Position, internalsSymbol } from 'reactflow';

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
        position: { x: 100 + index * 250, y: 200 + index * 100 },
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

    if (link.table1_id === undefined) {
      // We skip the relationship within the same table
      return;
    }

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

  const uniqueEdges: { [key: string]: boolean } = {};
  const cleanResult: EdgeResultItem[] = [];

  // Iterate through the array
  result.forEach((edge) => {
    // Generate a unique key for each edge by sorting sourceHandle and targetHandle
    const key1 = [edge.sourceHandle, edge.targetHandle].sort().join('-');
    const key2 = [edge.targetHandle, edge.sourceHandle].sort().join('-');

    // Check if either key already exists in uniqueEdges
    if (!uniqueEdges[key1] && !uniqueEdges[key2]) {
      // If not, add both keys to uniqueEdges and push the edge to the result
      uniqueEdges[key1] = true;
      uniqueEdges[key2] = true;
      cleanResult.push(edge);
    }
  });

  return cleanResult;
}

// returns the position (top,right,bottom or right) passed node compared to
function getParams(nodeA: any, nodeB: any) {
  const centerA = getNodeCenter(nodeA);
  const centerB = getNodeCenter(nodeB);

  const horizontalDiff = Math.abs(centerA.x - centerB.x);
  const verticalDiff = Math.abs(centerA.y - centerB.y);

  let position;

  // when the horizontal difference between the nodes is bigger, we use Position.Left or Position.Right for the handle
  if (horizontalDiff > verticalDiff) {
    position = centerA.x > centerB.x ? Position.Left : Position.Right;
  } else {
    // here the vertical difference between the nodes is bigger, so we use Position.Top or Position.Bottom for the handle
    position = centerA.y > centerB.y ? Position.Right : Position.Left;
  }

  const [x, y] = getHandleCoordsByPosition(nodeA, position);
  return [x, y, position];
}

function getHandleCoordsByPosition(node: any, handlePosition: any) {
  // console.log('node', node);
  // console.log('handlePosition', handlePosition);
  // console.log('internalsSymbol', internalsSymbol);
  // console.log('node[internalsSymbol].handleBounds', node[internalsSymbol].handleBounds);
  // console.log(
  //   'node[internalsSymbol].handleBounds.source',
  //   node[internalsSymbol].handleBounds.source
  // );

  // all handles are from type source, that's why we use handleBounds.source here
  const handle = node[internalsSymbol].handleBounds.source.find(
    (h: any) => h.position === handlePosition
  );
  if (!handle) {
    // Handle is undefined, handle this case accordingly
    console.error('Handle is undefined for position:', handlePosition);
  }
  console.log('handle:', handle);
  let offsetX = handle.width / 2;
  let offsetY = handle.height / 2;

  // this is a tiny detail to make the markerEnd of an edge visible.
  // The handle position that gets calculated has the origin top-left, so depending which side we are using, we add a little offset
  // when the handlePosition is Position.Right for example, we need to add an offset as big as the handle itself in order to get the correct position
  switch (handlePosition) {
    case Position.Left:
      offsetX = 0;
      break;
    case Position.Right:
      offsetX = handle.width;
      break;
    case Position.Top:
      offsetY = 0;
      break;
    case Position.Bottom:
      offsetY = handle.height;
      break;
  }

  const x = node.positionAbsolute.x + handle.x + offsetX;
  const y = node.positionAbsolute.y + handle.y + offsetY;

  return [x, y];
}

function getNodeCenter(node: any) {
  return {
    x: node.positionAbsolute.x + node.width / 2,
    y: node.positionAbsolute.y + node.height / 2,
  };
}

// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
export function getEdgeParams(source: any, target: any) {
  const [sx, sy, sourcePos] = getParams(source, target);
  const [tx, ty, targetPos] = getParams(target, source);

  return {
    sx,
    sy,
    tx,
    ty,
    sourcePos,
    targetPos,
  };
}
