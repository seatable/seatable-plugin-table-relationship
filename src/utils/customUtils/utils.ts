import { useState } from 'react';
import { EdgeResultItem, Link, NodeResultItem } from '../Interfaces/custom-interfaces/ERDPlugin';
import { TableArray } from '../Interfaces/template-interfaces/Table.interface';
import { MarkerType, Position, internalsSymbol } from 'reactflow';

export function generateNodes(allTables: TableArray): NodeResultItem[] {
  const ns: NodeResultItem[] = allTables?.map((table, index) => {
    const info = table.columns.map((cl) => {
      return { key: cl.key, type: cl.type, name: cl.name };
    });
    const position = { x: 100 + index * 250, y: 200 + index * 100 };
    const activeNode = {
      id: table.name.toString(),
      type: 'custom',
      position: position,
      data: {
        columns: info,
        position: position,
      },
    };
    return activeNode;
  });
  return ns;
}

export function generateEdges(links: Link[], tables: TableArray, ns: NodeResultItem[]): any[] {
  const result: EdgeResultItem[] = [];

  let sourceHandle = '';
  let targetHandle = '';
  links.forEach((link, index) => {
    if (link.table1_id === undefined) {
      // We skip the relationship within the same table
      return;
    }
    const sourceTbl = tables.find((table) => table._id === link.table1_id);
    const targetTbl = tables.find((table) => table._id === link.table2_id);
    const sourceNode = ns.find((n) => n.id === sourceTbl?.name);
    const targetNode = ns.find((n) => n.id === targetTbl?.name);

    if (sourceNode && targetNode) {
      sourceHandle = `${sourceNode.id}_0000_${
        sourceNode.position > targetNode.position ? 'l' : 'r'
      }-src`;
      targetHandle = `${targetNode.id}_0000_${
        sourceNode.position > targetNode.position ? 'r' : 'l'
      }-tgt`;
    }

    if (sourceTbl && targetTbl) {
      result.push({
        id: String(result.length),
        source: sourceTbl.name,
        target: targetTbl.name,
        sourceHandle: sourceHandle,
        targetHandle: targetHandle,
        type: 'smoothstep',
        markerEnd: MarkerType.ArrowClosed,
      });
    }
  });

  return result;
}

// THIS IS FOR EDGE IF WE NEED TO CONNECT ROW VALUES
// export function generateEdges(links: Link[], tables: TableArray): EdgeResultItem[] {
//   const result: EdgeResultItem[] = [];
//   console.log('links', links);
//   links.forEach((link, index) => {
//     const table2 = tables.find((table) => table._id === link.table2_id);

//     if (link.table1_id === undefined) {
//       // We skip the relationship within the same table
//       return;
//     }

//     const table1 = link.table1_id ? tables.find((table) => table._id === link.table1_id) : table2;
//     const source = table2 ? table2.name : '';
//     const target = table1 ? table1.name : source;

//     if (link.table2_table1_map) {
//       Object.entries(link.table2_table1_map).forEach(([sourceHandle, targetHandles]) => {
//         targetHandles.forEach((targetHandle) => {
//           result.push({
//             id: String(result.length),
//             source,
//             target,
//             sourceHandle,
//             targetHandle,
//             type: 'smoothstep',
//             markerEnd: MarkerType.ArrowClosed,
//           });
//         });
//       });
//     }

//     if (link.table1_table2_map) {
//       Object.entries(link.table1_table2_map).forEach(([targetHandle, sourceHandles]) => {
//         sourceHandles.forEach((sourceHandle) => {
//           result.push({
//             id: String(result.length),
//             source: target,
//             target: source,
//             sourceHandle,
//             targetHandle,
//             type: 'smoothstep',
//             markerEnd: MarkerType.ArrowClosed,
//           });
//         });
//       });
//     }
//   });

//   const uniqueEdges: { [key: string]: boolean } = {};
//   const cleanResult: EdgeResultItem[] = [];

//   // Iterate through the array
//   result.forEach((edge) => {
//     // Generate a unique key for each edge by sorting sourceHandle and targetHandle
//     const key1 = [edge.sourceHandle, edge.targetHandle].sort().join('-');
//     const key2 = [edge.targetHandle, edge.sourceHandle].sort().join('-');

//     // Check if either key already exists in uniqueEdges
//     if (!uniqueEdges[key1] && !uniqueEdges[key2]) {
//       // If not, add both keys to uniqueEdges and push the edge to the result
//       uniqueEdges[key1] = true;
//       uniqueEdges[key2] = true;
//       cleanResult.push(edge);
//     }
//   });

//   return cleanResult;
// }

// returns the position (top,right,bottom or right) passed node compared to
export function getParams(nodeA: any, nodeB: any) {
  const centerA = getNodeCenter(nodeA);
  const centerB = getNodeCenter(nodeB);
  console.log('centerA', centerA);
  console.log('centerB', centerB);
  const position = centerA.x > centerB.x ? Position.Left : Position.Right;

  const [x, y] = getHandleCoordsByPosition(nodeA, position);
  return [x, y, position];
}

function getHandleCoordsByPosition(node: any, handlePosition: any) {
  // all handles are from type source, that's why we use handleBounds.source here
  const handle = node[internalsSymbol].handleBounds.source.find(
    (h: any) => h.position === handlePosition
  );
  if (!handle) {
    // Handle is undefined, handle this case accordingly
    console.error('Handle is undefined for position:', handlePosition);
  }

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
  }

  const x = node.position.x + handle.x + offsetX;
  const y = node.position.y + handle.y + offsetY;

  return [x, y];
}

function getNodeCenter(node: any) {
  return {
    x: node.position.x + node.width / 2,
    y: node.position.y + node.height / 2,
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
