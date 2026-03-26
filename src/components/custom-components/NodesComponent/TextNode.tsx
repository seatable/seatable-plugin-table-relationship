import { useState, useEffect } from 'react';
import { memo } from 'react';
import { Handle, Position, NodeToolbar } from 'reactflow';
import {
  FaDroplet,
  FaDropletSlash,
  FaTrashCan,
  FaICursor,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
} from 'react-icons/fa6';
import stylesCustom from '../../../styles/custom-styles/PluginTR.module.scss';
import { Row } from 'reactstrap';
import intl from 'react-intl-universal';
import { AVAILABLE_LOCALES, DEFAULT_LOCALE } from '../../../locale';
const { [DEFAULT_LOCALE]: d } = AVAILABLE_LOCALES;

function selectElementContents(el: HTMLElement) {
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  if (sel) {
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

function getTextWidth(el: HTMLElement) {
  const inputText = el.innerHTML;
  const children = Array.from(el.childNodes);
  let width = 0;
  children.forEach((c) => {
    const text = c.textContent || '';
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    if (context) {
      context.font =
        el.style.fontSize + ' ' + window.getComputedStyle(el, null).getPropertyValue('font-family');
      const childWidth = context.measureText(text).width;
      if (Math.ceil(childWidth) > width) {
        width = Math.ceil(childWidth);
      }
    }
  });
  return Math.ceil(width);
}

function TextNode({ id, data }: { id: string; data: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  return (
    <>
      <NodeToolbar
        isVisible={undefined}
        position={Position.Top}
        align={'start'}
        style={{ flexDirection: 'row', display: 'flex' }}>
        <button
          className="react-flow__controls-button"
          title={intl.get('custom_plugin.edit_text').d(`${d.custom_plugin.edit_text}`)}
          onClick={() => {
            setIsEditing(true);
            const el = document.getElementById(id + '_label');
            if (el) {
              el.classList.add('nodrag');
              const length = el.innerText.length;
              el.style.cursor = 'text';
              el.contentEditable = 'true';
              el.focus();
            }
          }}>
          <i
            className="item-icon dtable-font dtable-icon-rename"
            aria-hidden="true"
            style={{ color: '#8c8c8c' }}></i>
        </button>
        <button
          className="react-flow__controls-button"
          title={
            data.hasBackground
              ? intl.get('custom_plugin.hide_background').d(`${d.custom_plugin.hide_background}`)
              : intl.get('custom_plugin.show_background').d(`${d.custom_plugin.show_background}`)
          }
          onClick={() => {
            data.onSave(id, { hasBackground: !data.hasBackground });
          }}>
          {data.hasBackground ? (
            <FaDropletSlash style={{ color: '#8c8c8c' }} />
          ) : (
            <FaDroplet style={{ color: '#8c8c8c' }} />
          )}
        </button>
        <button
          className="react-flow__controls-button"
          title={intl.get('custom_plugin.align_left').d(`${d.custom_plugin.align_left}`)}
          onClick={() => {
            data.onSave(id, { align: 'left' });
          }}>
          <FaAlignLeft style={{ color: '#8c8c8c' }} />
        </button>
        <button
          className="react-flow__controls-button"
          title={intl.get('custom_plugin.align_center').d(`${d.custom_plugin.align_center}`)}
          onClick={() => {
            data.onSave(id, { align: 'center' });
          }}>
          <FaAlignCenter style={{ color: '#8c8c8c' }} />
        </button>
        <button
          className="react-flow__controls-button"
          title={intl.get('custom_plugin.align_right').d(`${d.custom_plugin.align_right}`)}
          onClick={() => {
            data.onSave(id, { align: 'right' });
          }}>
          <FaAlignRight style={{ color: '#8c8c8c' }} />
        </button>
        <button
          className="react-flow__controls-button"
          title={intl.get('custom_plugin.delete_node').d(`${d.custom_plugin.delete_node}`)}
          onClick={() => data.onDelete(id)}>
          <i
            className="item-icon dtable-font dtable-icon-delete"
            aria-hidden="true"
            style={{ color: '#8c8c8c' }}></i>
        </button>
      </NodeToolbar>
      <div
        id={id + '_label'}
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{ __html: data.name }}
        onBlur={(e) => {
          setIsEditing(false);
          const el = e.target as HTMLDivElement;
          el.contentEditable = 'false';
          el.style.cursor = 'pointer';
          if (el.innerHTML === '' || el.innerHTML === '<br>') {
            data.onDelete(id);
          } else {
            data.onSave(id, {
              name: el.innerHTML,
              width: el.style.width,
              align: el.style.textAlign,
            });
          }
          el.classList.remove('nodrag');
        }}
        className={'react-flow__node-custom'}
        contentEditable={false}
        style={{
          textAlign: data.align ? data.align : 'left',
          width: data.width ? data.width : '180px',
          backgroundColor: data.hasBackground ? 'white' : 'transparent',
          padding: '10px',
          fontSize: data.fontSize + 'px',
          boxShadow: data.hasBackground
            ? '0 4px 6px -1px rgb(0 0 0 / 15%), 0 2px 4px -1px rgb(0 0 0 / 8%)'
            : 'none',
          lineHeight: 3 / data.fontSize + 1.5,
          outline: !data.hasBackground && isHovered ? '1px solid lightgray' : 'none',
        }}
        onKeyUp={(e) => {
          const el = e.target as HTMLDivElement;
          const newWidth = Math.max(50, getTextWidth(el)) + 30 + 'px';
          el.style.width = newWidth;
          data.onUpdate(id, { width: newWidth });
        }}
        onDoubleClick={(e) => {
          if (data.isEditing) e.stopPropagation();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    </>
  );
}

export default memo(TextNode);
