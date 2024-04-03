import { memo } from 'react';
import { Handle, Position } from 'reactflow';

function CustomNode({ id, data }: { id: string; data: any }) {
  console.log('data', data);
  console.log('id', id);

  return (
    <>
      <div className="custom-node__header">
        <strong>{id}</strong>
      </div>
      <div className="custom-node__body">
        {data.rows.map((row: any) => (
          <div key={row.id} id={row.id} className="custom-node__row">
            <Handle type="source" position={Position.Right} id={row.id} />
            <Handle type="target" position={Position.Right} id={row.id} />
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
