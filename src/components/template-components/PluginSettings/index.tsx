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
  activeComponents,
  allTables,
  appActiveState,
  activeTableViews,
  isShowSettings,
  onToggleSettings,
  onTableOrViewChange,
  activeRelationships,
  handleRelationships,
}) => {
  // State variables for table and view options
  const [tableOptions, setTableOptions] = useState<SelectOption[]>();
  const [viewOptions, setViewOptions] = useState<SelectOption[]>();
  const [tableSelectedOption, setTableSelectedOption] = useState<SelectOption>();
  const [viewSelectedOption, setViewSelectedOption] = useState<SelectOption>();

  // Change options when active table or view changes
  useEffect(() => {
    const { activeTableView } = appActiveState;

    // Create options for tables
    let tableOptions = allTables.map((item) => {
      let value = item._id;
      let label = truncateTableName(item.name);
      return { value, label };
    });

    // Create options for views
    let viewOptions = activeTableViews.map((item) => {
      let value = item._id;
      let label = truncateTableName(item.name);
      return { value, label };
    });

    // Set selected options based on activeTable and activeTableView
    let tableSelectedOption = {
      value: appActiveState?.activeTable?._id!,
      label: appActiveState.activeTableName,
    };
    let viewSelectedOption = viewOptions.find((item) => item.value === activeTableView?._id);

    // Update state with new options and selected values
    setTableOptions(tableOptions);
    setTableSelectedOption(tableSelectedOption);
    setViewOptions(viewOptions);
    setViewSelectedOption(viewSelectedOption);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appActiveState]);

  const handleShownFieldNames = (isShown: boolean) => {
    console.log('isShown', isShown);
  };

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
          {activeComponents.settingsDropDowns && (
            <div className={stylesPSettings.settings_dropdowns}>
              <div>
                <p className="d-inline-block mb-2">{intl.get('table').d(`${d.table}`)}</p>
                {/* Toggle table view */}
                <DtableSelect
                  value={tableSelectedOption}
                  options={tableOptions}
                  onChange={(selectedOption: SelectOption) => {
                    let type = 'table' as SettingsOption;
                    onTableOrViewChange(type, selectedOption);
                  }}
                />
              </div>

              <div>
                <p className="d-inline-block mb-2 mt-3">{intl.get('view').d(`${d.view}/`)}</p>
                {/* Toggle table view */}
                <DtableSelect
                  value={viewSelectedOption}
                  options={viewOptions}
                  onChange={(selectedOption: SelectOption) => {
                    let type = 'view' as SettingsOption;
                    onTableOrViewChange(type, selectedOption);
                  }}
                />
              </div>
            </div>
          )}
          <div className={'mt-2'}>
            <div className="mb-2 d-flex align-items-center justify-content-between">
              <p>Show linked record relationship</p>
              {intl.get('preset_add').d(`${d.preset_add}`)}
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
              <p>Show lookup relationship</p>
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
              <p>Show 2nd level lookup relationship</p>
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
              <p>Show tables without links</p>
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
