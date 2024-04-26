import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import stylesCustom from '../../../styles/custom-styles/ERDPlugin.module.scss';

function CustomNode({ id, data }: { id: string; data: any }) {
  return (
    <>
      {/* <div
        className={
          !data.selected ? stylesCustom.custom_node_header : stylesCustom.custom_node_header_sel
        }> */}
      <div className={stylesCustom.custom_node_header}>
        <strong>{data.name.substring(0, 25)}</strong>
      </div>
      <div className={stylesCustom.custom_node_body}>
        {data.columns.map((cl: any) => (
          <div key={cl.key} id={cl.key} className={stylesCustom.custom_node_row}>
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
            <div className={stylesCustom.custom_node_row_content}>
              <div className={stylesCustom.custom_node_row_content_value}>{cl.name}</div>
              <div className={stylesCustom.custom_node_row_content_id}>{cl.type}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default memo(CustomNode);
