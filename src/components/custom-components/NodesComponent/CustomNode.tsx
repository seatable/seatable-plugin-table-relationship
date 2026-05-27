import { memo } from 'react';
import { Handle, Position, NodeResizeControl, ResizeControlVariant } from 'reactflow';
import { CellType, COLUMNS_ICON_CONFIG } from 'dtable-utils';
import { FaLinkSlash } from 'react-icons/fa6';
import intl from 'react-intl-universal';
import { AVAILABLE_LOCALES, DEFAULT_LOCALE } from '../../../locale';
import stylesCustom from '../../../styles/custom-styles/PluginTR.module.scss';
import { LINK_TYPE } from '../../../utils/custom-constants/constants';
const { [DEFAULT_LOCALE]: d } = AVAILABLE_LOCALES;

const DEFAULT_COLOR = getComputedStyle(document.documentElement)
  .getPropertyValue('--primary')
  .trim();

function parseColor(
  color: string | undefined | null
): { r: number; g: number; b: number; a: number } | null {
  if (!color) return null;

  const hex6 = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (hex6)
    return { r: parseInt(hex6[1], 16), g: parseInt(hex6[2], 16), b: parseInt(hex6[3], 16), a: 1 };

  const hex8 = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (hex8)
    return {
      r: parseInt(hex8[1], 16),
      g: parseInt(hex8[2], 16),
      b: parseInt(hex8[3], 16),
      a: parseInt(hex8[4], 16) / 255,
    };

  const rgba =
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)/i.exec(color);
  if (rgba)
    return {
      r: parseInt(rgba[1]),
      g: parseInt(rgba[2]),
      b: parseInt(rgba[3]),
      a: rgba[4] !== undefined ? parseFloat(rgba[4]) : 1,
    };

  console.warn('parseColor: Unknown format', color);
  return null;
}

function getIconByType(ct: any, t: any) {
  const C_T = Object.keys(ct).find((key) => ct[key] === t);
  const i = COLUMNS_ICON_CONFIG[CellType[C_T as string] as keyof typeof COLUMNS_ICON_CONFIG];
  return i;
}

function CustomNode({ id, data, selected }: { id: string; data: any; selected?: boolean }) {
  const parsed = parseColor(data.headerColor);
  const validHeaderColor = parsed ? data.headerColor : DEFAULT_COLOR;

  let textColor = 'white';
  if (parsed) {
    // Composition sur fond blanc
    const alpha = parsed.a;
    const r = Math.round(alpha * parsed.r + (1 - alpha) * 255);
    const g = Math.round(alpha * parsed.g + (1 - alpha) * 255);
    const b = Math.round(alpha * parsed.b + (1 - alpha) * 255);

    const lumaYIQ = Math.round((r * 299 + g * 587 + b * 114) / 1000);
    textColor = lumaYIQ > 160 ? 'black' : 'white'; // limit value should be 125, but set to 160 to keep the white text color with the default orange (lumaYIQ = 151)
  }
  // Approximate header height: padding (8+8) + content (~1.2 * fontSize) + 1px border.
  // Used to shift the resize thumb down so it's centered on the body, not the whole node.
  const fs = data.fontSize ?? 14;
  const headerHeightPx = 17 + 1.2 * fs;
  const thumbTop = `calc(50% + ${headerHeightPx / 2}px)`;
  return (
    <>
      <NodeResizeControl
        className="tr-resize-control"
        position="left"
        variant={ResizeControlVariant.Line}
        minWidth={120}
        maxWidth={500}
        onResizeEnd={() => data.onResizeEnd?.(id)}>
        <div className="tr-resize-line" />
        <div className="tr-resize-thumb" style={{ top: thumbTop }} />
      </NodeResizeControl>
      <NodeResizeControl
        className="tr-resize-control"
        position="right"
        variant={ResizeControlVariant.Line}
        minWidth={120}
        maxWidth={500}
        onResizeEnd={() => data.onResizeEnd?.(id)}>
        <div className="tr-resize-line" />
        <div className="tr-resize-thumb" style={{ top: thumbTop }} />
      </NodeResizeControl>
      <div
        className={stylesCustom.custom_node_header}
        style={{ backgroundColor: validHeaderColor, color: textColor }}>
        <strong>{data.name}</strong>
        {data.hasHiddenLinks && (
          <FaLinkSlash
            title={intl.get('custom_plugin.tbl_hasLinks').d(`${d.custom_plugin.tbl_hasLinks}`)}
            style={{ marginLeft: 'auto', opacity: 0.7, flexShrink: 0 }}
          />
        )}
      </div>
      <div className={stylesCustom.custom_node_body}>
        {data.columns.map((cl: any) => (
          <div key={cl.key} id={cl.key} className={stylesCustom.custom_node_row}>
            <Handle
              type="source"
              position={Position.Left}
              style={{
                left: '-10px',
                visibility: 'hidden',
                top: (data.fontSize - 2).toString() + 'px',
              }}
              id={id + '_' + cl.key + '_l-src'}
            />
            <Handle
              type="target"
              position={Position.Right}
              style={{
                right: '-10px',
                visibility: 'hidden',
                top: (data.fontSize - 2).toString() + 'px',
              }}
              id={id + '_' + cl.key + '_r-tgt'}
            />
            <Handle
              type="target"
              position={Position.Left}
              style={{
                left: '-10px',
                visibility: 'hidden',
                top: (data.fontSize - 2).toString() + 'px',
              }}
              id={id + '_' + cl.key + '_l-tgt'}
            />
            <Handle
              type="source"
              position={Position.Right}
              style={{
                right: '-10px',
                visibility: 'hidden',
                top: (data.fontSize - 2).toString() + 'px',
              }}
              id={id + '_' + cl.key + '_r-src'}
            />
            <div className={stylesCustom.custom_node_row_content}>
              <div className={stylesCustom.custom_node_row_content_icon}>
                <i
                  className={`dtable-font ${getIconByType(CellType, cl.type)}`}
                  style={{ fontSize: 1 + Math.round(data.fontSize / 1.6) }}></i>
              </div>
              <div className={stylesCustom.custom_node_row_content_value}>{cl.name}</div>
              <div className={stylesCustom.custom_node_row_content_ref}>
                {cl.type === LINK_TYPE.link ? (cl.isMultiple ? '[n]' : '[1]') : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default memo(CustomNode);
