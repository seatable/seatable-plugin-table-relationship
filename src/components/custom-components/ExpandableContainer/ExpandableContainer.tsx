import React, { createElement, PropsWithChildren } from 'react';
import stylesPSettings from '../../../styles/template-styles/PluginSettings.module.scss';

export function ContainerHeader({ children }: PropsWithChildren<unknown>): JSX.Element {
  return (
    <div className={'expandable-header'}>
      <span
        className="plugin-table-relationship-setting line-expander"
        onClick={(evt) => {
          const spanTarget = evt.target as HTMLSpanElement;
          spanTarget?.classList.toggle('expanded');
          const expandableContainer = spanTarget.parentElement?.parentElement as HTMLDivElement;
          const expandableContent = spanTarget.parentElement?.parentElement
            ?.children[1] as HTMLDivElement;

          if (expandableContainer.classList.contains('expanded-container')) {
            expandableContent.classList.remove('expanded-content');
            expandableContent.style.overflow = 'hidden';
            expandableContent.style.height = '0px';
            expandableContainer.classList.remove('expanded-container');
            expandableContainer.style.overflow = 'hidden';
          } else {
            expandableContainer.classList.add('expanded-container');
            expandableContainer.style.overflow = 'hidden';
          }
        }}></span>
      {children}
    </div>
  );
}

export function ContainerContent({ children }: PropsWithChildren<unknown>): JSX.Element {
  return <div className="ml-2 expandable-content">{children}</div>;
}

function outerHeight(element: HTMLElement) {
  const height = element.offsetHeight,
    style = window.getComputedStyle(element);

  let outerHeight = ['margin-top', 'margin-bottom']
    .map((key) => parseInt(style.getPropertyValue(key), 10))
    .reduce((prev, cur) => prev + cur);
  return height + outerHeight;
}

export function ExpandableContainer({ children }: PropsWithChildren<unknown>) {
  return (
    <div
      className={stylesPSettings.settings_fields_columns + ' expandable-container'}
      draggable="false"
      onTransitionEnd={(event) => {
        const expandableContainer = event.target as HTMLDivElement;
        if (
          expandableContainer.classList.contains('expandable-container') &&
          expandableContainer.classList.contains('expanded-container')
        ) {
          const expandableContent = expandableContainer.children[1] as HTMLDivElement;
          expandableContent.classList.add('expanded-content');
          expandableContent.style.overflow = 'visible';
          expandableContainer.style.overflow = 'visible';
          let height = 0;
          for (let i = 0; i < expandableContent.childNodes.length; i++) {
            let child = expandableContent.childNodes[i] as HTMLElement;
            height += outerHeight(child);
          }
          expandableContent.style.height = height.toString() + 'px';
        }
      }}>
      {children}
    </div>
  );
}
