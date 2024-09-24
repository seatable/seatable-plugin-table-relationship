import React, { useEffect, useState } from 'react';
import DtableSelect from '../Elements/dtable-select';
import stylesPSettings from '../../../styles/template-styles/PluginSettings.module.scss';
import stylesPresets from '../../../styles/template-styles/PluginPresets.module.scss';
import {
  SelectOption,
  IPluginSettingsProps,
} from '../../../utils/template-interfaces/PluginSettings.interface';
import { truncateTableName } from '../../../utils/template-utils/utils';
import { HiOutlineChevronDoubleRight } from 'react-icons/hi2';
import intl from 'react-intl-universal';
import { AVAILABLE_LOCALES, DEFAULT_LOCALE } from '../../../locale';
import { SettingsOption } from '../../../utils/types';
const { [DEFAULT_LOCALE]: d } = AVAILABLE_LOCALES;

// PluginSettings component for managing table and view options
const PluginSettings: React.FC<IPluginSettingsProps> = ({
  isShowSettings,
  onToggleSettings,
  activeRelationships,
  handleRelationships,
}) => {
  return (
    <div
      className={`bg-white ${
        isShowSettings ? stylesPSettings.settings : stylesPSettings.settings_hide
      }`}>
      <div className="p-5">
        <div
          className={`d-flex align-items-center justify-content-between ${stylesPSettings.settings_header}`}>
          <h4 className="m-0">{intl.get('settings_headline').d(`${d.settings_headline}`)}</h4>
          <button
            className={stylesPresets.presets_uncollapse_btn2_settings}
            onClick={onToggleSettings}>
            <HiOutlineChevronDoubleRight />
          </button>
        </div>
        <div>
          <div className={'mt-2'}>
            <div className="mb-2 d-flex align-items-center justify-content-between">
              <p>{intl.get('custom_plugin.rel_links').d(`${d.custom_plugin.rel_links}`)}</p>
              <button
                onClick={() => {
                  handleRelationships({
                    ...activeRelationships,
                    recRel: !activeRelationships.recRel,
                  });
                }}
                className={`${
                  activeRelationships.recRel
                    ? stylesPSettings.settings_fields_toggle_btns_active
                    : stylesPSettings.settings_fields_toggle_btns
                } `}></button>
            </div>
          </div>
          <div className={'mt-2'}>
            <div className="mb-2 d-flex align-items-center justify-content-between">
              <p>{intl.get('custom_plugin.rel_lookup').d(`${d.custom_plugin.rel_lookup}`)}</p>
              <button
                onClick={() => {
                  handleRelationships({
                    ...activeRelationships,
                    lkRel: !activeRelationships.lkRel,
                  });
                }}
                className={`${
                  activeRelationships.lkRel
                    ? stylesPSettings.settings_fields_toggle_btns_active
                    : stylesPSettings.settings_fields_toggle_btns
                } `}></button>
            </div>
          </div>
          <div className={'mt-2'}>
            <div className="mb-2 d-flex align-items-center justify-content-between">
              <p>{intl.get('custom_plugin.rel_lookup2nd').d(`${d.custom_plugin.rel_lookup2nd}`)}</p>
              <button
                onClick={() => {
                  handleRelationships({
                    ...activeRelationships,
                    lk2Rel: !activeRelationships.lk2Rel,
                  });
                }}
                className={`${
                  activeRelationships.lk2Rel
                    ? stylesPSettings.settings_fields_toggle_btns_active
                    : stylesPSettings.settings_fields_toggle_btns
                } `}></button>
            </div>
          </div>
          <div className={'mt-2'}>
            <div className="mb-2 d-flex align-items-center justify-content-between">
              <p>{intl.get('custom_plugin.tbl_noLinks').d(`${d.custom_plugin.tbl_noLinks}`)}</p>
              <button
                onClick={() => {
                  handleRelationships({
                    ...activeRelationships,
                    tblNoLnk: !activeRelationships.tblNoLnk,
                  });
                }}
                className={`${
                  activeRelationships.tblNoLnk
                    ? stylesPSettings.settings_fields_toggle_btns_active
                    : stylesPSettings.settings_fields_toggle_btns
                } `}></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PluginSettings;
