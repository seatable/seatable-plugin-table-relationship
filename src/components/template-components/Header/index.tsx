import React, { useState, useEffect } from 'react';
import styles from '../../../styles/template-styles/Plugin.module.scss';
import stylesPPresets from '../../../styles/template-styles/PluginPresets.module.scss';
import { IHeaderProps } from '../../../utils/template-interfaces/Header.interface';
import { PLUGIN_ID } from '../../../utils/template-constants';
import { HiOutlineChevronDoubleRight } from 'react-icons/hi2';

import { useReactFlow } from 'reactflow';
import { setViewportPluginDataStoreFn } from '../../../utils/custom-utils/utils';
import intl from 'react-intl-universal';
import { AVAILABLE_LOCALES, DEFAULT_LOCALE } from '../../../locale';
const { [DEFAULT_LOCALE]: d } = AVAILABLE_LOCALES;

const Header: React.FC<IHeaderProps> = (props) => {
  const {
    presetName,
    isShowPresets,
    onTogglePresets,
    togglePlugin,
    pluginDataStore,
    appActiveState,
  } = props;
  const [customComponentContent, setCustomComponentContent] = useState<string | null>(null);
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    const input = document.getElementById(PLUGIN_ID);
    if (input) {
      setCustomComponentContent(input.innerHTML);
    }
  }, []);

  function onToggleView() {
    reactFlowInstance.fitView(); //{ maxZoom: 1.2, minZoom: 0 });
    const fitView = reactFlowInstance.getViewport();
    setViewportPluginDataStoreFn(pluginDataStore, appActiveState.activePresetId, fitView);
  }

  return (
    <div className={styles.plugin_header}>
      <div className={'d-flex align-items-center justify-content-start'}>
        <div className={`align-items-center ${isShowPresets ? 'd-none' : 'd-flex'} `}>
          <button
            className={stylesPPresets.presets_uncollapse_btn2_settings}
            onClick={onTogglePresets}>
            <HiOutlineChevronDoubleRight />
          </button>
        </div>
        <div className={styles.plugin_header_pluginName}>
          <p className="font-weight-bold">{presetName}</p>
        </div>
      </div>

      <div
        className={`d-flex align-items-center justify-content-end ${styles.plugin_header_settings}`}>
        <span className={styles.plugin_header_icon_btn} onClick={onToggleView}>
          <button
            className="react-flow__controls-button react-flow__controls-fitview"
            title={intl.get('custom_plugin.fit_view').d(`${d.custom_plugin.fit_view}`)}
            aria-label="fit view"
            type="button"
            style={{ border: 'none' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 30">
              <path d="M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z"></path>
            </svg>
          </button>
        </span>
        <span className={styles.plugin_header_icon_btn} onClick={togglePlugin}>
          <span
            className="react-flow__controls-button dtable-font dtable-icon-x"
            style={{ border: 'none' }}
            title={intl.get('custom_plugin.close').d(`${d.custom_plugin.close}`)}></span>
        </span>
      </div>
    </div>
  );
};

export default Header;
