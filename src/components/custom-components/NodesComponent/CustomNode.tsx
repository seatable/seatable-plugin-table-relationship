import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { CellType as CELL_TYPE, COLUMNS_ICON_CONFIG } from 'dtable-utils';
import stylesCustom from '../../../styles/custom-styles/ERDPlugin.module.scss';

function CustomNode({ id, data }: { id: string; data: any }) {
  return (
    <>
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
              <div>
                <div className={stylesCustom.custom_node_row_content_icon}>
                  <i
                    className={`dtable-font ${
                      COLUMNS_ICON_CONFIG[CELL_TYPE[cl.type.toUpperCase()]]
                    }`}
                    style={{ fontSize: '10px' }}></i>
                </div>
              </div>
              <div className={stylesCustom.custom_node_row_content_value}>{cl.name}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default memo(CustomNode);
