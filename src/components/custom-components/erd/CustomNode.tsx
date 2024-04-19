import { memo } from 'react';
import { Handle, Position } from 'reactflow';

function CustomNode({ id, data }: { id: string; data: any }) {
  return (
    <>
      <div className="custom-node__header">
        <strong>{id.substring(0, 25)}</strong>
      </div>
      <div className="custom-node__body">
        {data.columns.map((cl: any) => (
          <div key={cl.key} id={cl.key} className="custom-node__row">
            <Handle
              type="source"
              position={Position.Left}
              style={{ left: '-10px' }}
              id={id + '_' + cl.key + '_l-src'}
            />
            <Handle
              type="target"
              position={Position.Right}
              style={{ right: '-10px' }}
              id={id + '_' + cl.key + '_r-tgt'}
            />
            <Handle
              type="target"
              position={Position.Left}
              style={{ left: '-10px' }}
              id={id + '_' + cl.key + '_l-tgt'}
            />
            <Handle
              type="source"
              position={Position.Right}
              style={{ right: '-10px' }}
              id={id + '_' + cl.key + '_r-src'}
            />
            <div className="custom-node__row-content">
              <div className="custom-node__value">{cl.name}</div>
              <div className="custom-node__id">{cl.type}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default memo(CustomNode);
