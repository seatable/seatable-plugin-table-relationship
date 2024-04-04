import { memo, useEffect, useState } from 'react';
import { Handle, Position } from 'reactflow';

function CustomNode({ id, data }: { id: string; data: any }) {
  const [prevX, setPrevX] = useState<number>(0);

  return (
    <>
      <div className="custom-node__header">
        <strong>{id}</strong>
      </div>
      <div className="custom-node__body">
        {data.rows.map((row: any) => (
          <div key={row.id} id={row.id} className="custom-node__row">
            <Handle type="source" position={Position.Left} style={{ left: '-10px' }} id={row.id} />
            <Handle
              type="target"
              position={Position.Right}
              style={{ right: '-10px' }}
              id={row.id}
            />
            <div className="custom-node__row-content">
              <div className="custom-node__value">{row.value}</div>
              <div className="custom-node__id">{typeof row.value}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default memo(CustomNode);
