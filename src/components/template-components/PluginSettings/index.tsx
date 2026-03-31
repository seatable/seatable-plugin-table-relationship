import React, { useEffect, useState } from 'react';
import DtableSelect from '../Elements/dtable-select';
import Select, { SingleValue, StylesConfig, CSSObjectWithLabel } from 'react-select';
import stylesPSettings from '../../../styles/template-styles/PluginSettings.module.scss';
import stylesPresets from '../../../styles/template-styles/PluginPresets.module.scss';
import {
  SelectOption,
  IPluginSettingsProps,
} from '../../../utils/template-interfaces/PluginSettings.interface';
import { truncateTableName } from '../../../utils/template-utils/utils';
import { filterTablesWithLinks, filterTablesWithoutLinks } from '../../../utils/custom-utils/utils';
import { HiOutlineChevronDoubleRight } from 'react-icons/hi2';
import intl from 'react-intl-universal';
import { AVAILABLE_LOCALES, DEFAULT_LOCALE } from '../../../locale';
import { SettingsOption } from '../../../utils/types';
import { Table } from '../../../utils/template-interfaces/Table.interface';
import '../../../assets/css/table-relationship.css';
import {
  ExpandableContainer,
  ContainerHeader,
  ContainerContent,
} from '../../custom-components/ExpandableContainer/ExpandableContainer';
import ColorPicker from '../../../components/color-picker';
import PixelEditor from '../../../components/pixel-editor';
const { [DEFAULT_LOCALE]: d } = AVAILABLE_LOCALES;

const line = (label = 'solid') => ({
  overflow: 'hidden',
  textAlign: 'center',
  color: 'transparent',

  ':before': {
    content: '""',
    display: 'inline-block',
    position: 'relative',
    verticalAlign: 'middle',
    width: '100%',
    borderTop: '2px ' + label + ' black',
  },
});

interface LineStyleOption {
  readonly value: string;
  readonly label: string;
}

const LineStyleOptions: readonly LineStyleOption[] = [
  { value: '0', label: 'solid' },
  { value: '5 5', label: 'dashed' },
  { value: '1 5', label: 'dotted' },
];

// Map a stored strokeDasharray (possibly corrupted by old generateEdges mutation)
// back to the canonical LineStyleOption value.
function normalizeStrokeDasharray(val: string): string {
  if (!val || val === '0') return '0';
  const parts = val.split(' ');
  if (parts.length === 2 && parts[0] === parts[1]) return '5 5'; // dashed
  if (parts.length === 2 && parts[0] !== parts[1]) return '1 5'; // dotted
  return '0';
}

const lineStyles: StylesConfig<LineStyleOption> = {
  option: (styles, { data, isDisabled, isFocused, isSelected }) => {
    return {
      ...styles,
      overflow: 'hidden',
      textAlign: 'center' as 'center',
      color: 'transparent',
      height: '2.5em',
      backgroundColor: isDisabled
        ? undefined
        : isSelected
          ? '#ccc'
          : isFocused
            ? '#eee'
            : undefined,
      ':before': {
        content: '""',
        display: 'inline-block',
        position: 'relative',
        verticalAlign: 'middle',
        width: '100%',
        borderTop: '2px ' + data.label + ' black',
      },
    };
  },
  singleValue: (styles, { data }) => ({ ...styles, ...line(data.label) }) as CSSObjectWithLabel,
};

// PluginSettings component for managing table and view options
const PluginSettings: React.FC<IPluginSettingsProps> = ({
  allTables,
  appActiveState,
  activeTableViews,
  isShowSettings,
  onToggleSettings,
  onTableOrViewChange,
  activeRelationships,
  handleRelationships,
  activeTableDisplay,
  handleTableDisplays,
  previewHeaderColor,
  onPreviewHeaderColor,
}) => {
  // State variables for table and view options
  const [tableOptions, setTableOptions] = useState<SelectOption[]>();
  const [viewOptions, setViewOptions] = useState<SelectOption[]>();
  const [tableSelectedOption, setTableSelectedOption] = useState<SelectOption>();
  const [viewSelectedOption, setViewSelectedOption] = useState<SelectOption>();
  // const displayedHeaderColor = previewHeaderColor ?? activeTableDisplay.headerColor;

  let fields = allTables;

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

  // type Style = Partial<CSSStyleDeclaration>;

  function updateSliderFill(input: HTMLInputElement) {
    const min = Number(input.min) || 0;
    const max = Number(input.max) || 100;
    const val = ((Number(input.value) - min) / (max - min)) * 100;
    input.style.background = `linear-gradient(to right, #ff8000 ${val}%, #dee2e6 ${val}%)`;
  }

  useEffect(() => {
    const sliders = document.querySelectorAll<HTMLInputElement>(
      '.table-relationships-plugin-slider'
    );
    const handlers: Array<[HTMLInputElement, () => void]> = [];
    sliders.forEach((input) => {
      updateSliderFill(input);
      const handler = () => updateSliderFill(input);
      input.addEventListener('input', handler);
      handlers.push([input, handler]);
    });
    return () => {
      handlers.forEach(([input, handler]) => {
        input.removeEventListener('input', handler);
      });
    };
  }, [
    activeTableDisplay.edgeStrokes?.link.strokeWidth,
    activeTableDisplay.edgeStrokes?.formula.strokeWidth,
    activeTableDisplay.edgeStrokes?.formula2nd.strokeWidth,
  ]);

  return (
    <div
      className={`bg-white ${
        isShowSettings ? stylesPSettings.settings : stylesPSettings.settings_hide
      }`}
      style={{ overflow: 'auto', position: 'relative', flexShrink: '0' }}>
      <div className="pt-0 pb-5 pl-5 pr-5">
        <div
          className={`d-flex align-items-center justify-content-between ${stylesPSettings.settings_header} sticky-top bg-white pt-5`}>
          <div>
            <div
              className="m-0 d-inline-block nav-link active"
              title="Settings"
              onClick={() => {
                let settingsContent = document.getElementsByClassName(
                  'settings-content'
                )[0] as HTMLDivElement;
                let themeContent = document.getElementsByClassName(
                  'theme-content'
                )[0] as HTMLDivElement;
                let settingsTitle = document.querySelector('[title="Settings"]') as HTMLDivElement;
                let themeTitle = document.querySelector('[title="Theme"]') as HTMLDivElement;
                settingsContent.classList.replace('tab-pane', 'active');
                themeContent.classList.replace('active', 'tab-pane');
                settingsTitle.classList.add('active');
                themeTitle.classList.remove('active');
              }}>
              <h4>{intl.get('settings_headline').d(`${d.settings_headline}`)}</h4>
            </div>
            <div
              className="m-0 d-inline-block nav-link"
              title="Theme"
              onClick={() => {
                let settingsContent = document.getElementsByClassName(
                  'settings-content'
                )[0] as HTMLDivElement;
                let themeContent = document.getElementsByClassName(
                  'theme-content'
                )[0] as HTMLDivElement;
                let settingsTitle = document.querySelector('[title="Settings"]') as HTMLDivElement;
                let themeTitle = document.querySelector('[title="Theme"]') as HTMLDivElement;
                settingsContent.classList.replace('active', 'tab-pane');
                themeContent.classList.replace('tab-pane', 'active');
                settingsTitle.classList.remove('active');
                themeTitle.classList.add('active');
              }}>
              <h4>{intl.get('theme_headline').d(`${d.theme_headline}`)}</h4>
            </div>
          </div>
          <button
            className={stylesPresets.presets_uncollapse_btn2_settings}
            onClick={onToggleSettings}>
            <HiOutlineChevronDoubleRight />
          </button>
        </div>
        <div className="table-relationships-plugin tab-content">
          <div className="settings-content pb-9 active">
            <div className={'mt-2'}>
              <p className="d-inline-block mb-2" style={{ color: '#808080' }}>
                {intl.get('custom_plugin.title_link').d(`${d.custom_plugin.title_link}`)}
              </p>
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
              <div className="mb-2 d-flex align-items-center justify-content-between">
                <p>
                  {intl.get('custom_plugin.rel_self_links').d(`${d.custom_plugin.rel_self_links}`)}
                </p>
                <button
                  onClick={() => {
                    handleRelationships({
                      ...activeRelationships,
                      recSelfRel: !activeRelationships.recSelfRel,
                    });
                  }}
                  className={`${
                    activeRelationships.recSelfRel
                      ? stylesPSettings.settings_fields_toggle_btns_active
                      : stylesPSettings.settings_fields_toggle_btns
                  } `}></button>
              </div>
            </div>
            <div className={'mt-2'}>
              <p className="d-inline-block mb-2" style={{ color: '#808080' }}>
                {intl.get('custom_plugin.title_formula').d(`${d.custom_plugin.title_formula}`)}
              </p>
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
                <p>{intl.get('custom_plugin.rel_count').d(`${d.custom_plugin.rel_count}`)}</p>
                <button
                  onClick={() => {
                    handleRelationships({
                      ...activeRelationships,
                      countLinks: !activeRelationships.countLinks,
                    });
                  }}
                  className={`${
                    activeRelationships.countLinks
                      ? stylesPSettings.settings_fields_toggle_btns_active
                      : stylesPSettings.settings_fields_toggle_btns
                  } `}></button>
              </div>
            </div>
            <div className={'mt-2'}>
              <div className="mb-2 d-flex align-items-center justify-content-between">
                <p>{intl.get('custom_plugin.rel_rollup').d(`${d.custom_plugin.rel_rollup}`)}</p>
                <button
                  onClick={() => {
                    handleRelationships({
                      ...activeRelationships,
                      rollup: !activeRelationships.rollup,
                    });
                  }}
                  className={`${
                    activeRelationships.rollup
                      ? stylesPSettings.settings_fields_toggle_btns_active
                      : stylesPSettings.settings_fields_toggle_btns
                  } `}></button>
              </div>
            </div>
            <div className={'mt-2'}>
              <div className="mb-2 d-flex align-items-center justify-content-between">
                <p>{intl.get('custom_plugin.rel_max').d(`${d.custom_plugin.rel_max}`)}</p>
                <button
                  onClick={() => {
                    handleRelationships({
                      ...activeRelationships,
                      findmax: !activeRelationships.findmax,
                    });
                  }}
                  className={`${
                    activeRelationships.findmax
                      ? stylesPSettings.settings_fields_toggle_btns_active
                      : stylesPSettings.settings_fields_toggle_btns
                  } `}></button>
              </div>
            </div>
            <div className={'mt-2'}>
              <div className="mb-2 d-flex align-items-center justify-content-between">
                <p>{intl.get('custom_plugin.rel_min').d(`${d.custom_plugin.rel_min}`)}</p>
                <button
                  onClick={() => {
                    handleRelationships({
                      ...activeRelationships,
                      findmin: !activeRelationships.findmin,
                    });
                  }}
                  className={`${
                    activeRelationships.findmin
                      ? stylesPSettings.settings_fields_toggle_btns_active
                      : stylesPSettings.settings_fields_toggle_btns
                  } `}></button>
              </div>
            </div>
            <div className={'mt-2'}>
              <p className="d-inline-block mb-2" style={{ color: '#808080' }}>
                {intl.get('custom_plugin.title_tables').d(`${d.custom_plugin.title_tables}`)}
              </p>
              <div className="mb-2 d-flex align-items-center justify-content-between">
                <p>{intl.get('custom_plugin.tlb_allCols').d(`${d.custom_plugin.tlb_allCols}`)}</p>
                <button
                  onClick={() => {
                    handleTableDisplays({
                      ...activeTableDisplay,
                      tblAllCols: !activeTableDisplay.tblAllCols,
                    });
                  }}
                  className={`${
                    activeTableDisplay.tblAllCols
                      ? stylesPSettings.settings_fields_toggle_btns_active
                      : stylesPSettings.settings_fields_toggle_btns
                  } `}></button>
              </div>
              <div className="mb-2 d-flex align-items-center justify-content-between">
                <p>{intl.get('custom_plugin.tbl_noLinks').d(`${d.custom_plugin.tbl_noLinks}`)}</p>
                <button
                  onClick={() => {
                    handleTableDisplays({
                      ...activeTableDisplay,
                      tblNoLnk: !activeTableDisplay.tblNoLnk,
                      displayedTables: !activeTableDisplay.tblNoLnk
                        ? allTables
                            .filter(
                              (t) =>
                                activeTableDisplay.displayedTables.includes(t._id) ||
                                !filterTablesWithLinks(allTables).includes(t)
                            )
                            .map(function (t) {
                              return t._id;
                            })
                        : filterTablesWithLinks(
                            allTables.filter((t) =>
                              activeTableDisplay.displayedTables.includes(t._id)
                            )
                          ).map(function (t) {
                            return t._id;
                          }),
                    });
                  }}
                  className={`${
                    activeTableDisplay.tblNoLnk
                      ? stylesPSettings.settings_fields_toggle_btns_active
                      : stylesPSettings.settings_fields_toggle_btns
                  } `}></button>
              </div>
              <div>
                <div className="mb-2 d-flex align-items-center justify-content-between">
                  <p>
                    {intl
                      .get('custom_plugin.displayed_tables')
                      .d(`${d.custom_plugin.displayed_tables}`)}
                  </p>
                  <button
                    onClick={() => {
                      let displayedTables = !activeTableDisplay.isAllShown
                        ? activeTableDisplay.tblNoLnk
                          ? allTables.map(function (t) {
                              return t._id;
                            })
                          : filterTablesWithLinks(allTables).map(function (t) {
                              return t._id;
                            })
                        : [];
                      handleTableDisplays({
                        ...activeTableDisplay,
                        isAllShown: !activeTableDisplay.isAllShown,
                        displayedTables: displayedTables,
                      });
                    }}
                    className={stylesPSettings.settings_fields_show_all_btn}>
                    {activeTableDisplay.isAllShown
                      ? intl.get('custom_plugin.hide_all').d(`${d.custom_plugin.hide_all}`)
                      : intl.get('custom_plugin.show_all').d(`${d.custom_plugin.show_all}`)}
                  </button>
                </div>
                {fields
                  .filter((t) => t !== null)
                  ?.map((t, i) => (
                    <ExpandableContainer key={t?._id + 'ExpandableContainer'}>
                      <ContainerHeader>
                        <p className="ml-2 mb-0">{t?.name}</p>
                        <button
                          onClick={() => {
                            const displayedTables = activeTableDisplay.displayedTables.includes(
                              t?._id
                            )
                              ? activeTableDisplay.displayedTables.filter((id) => id !== t?._id)
                              : [...activeTableDisplay.displayedTables, t?._id];
                            handleTableDisplays({ ...activeTableDisplay, displayedTables });
                          }}
                          title={
                            filterTablesWithoutLinks(allTables).includes(t) &&
                            !activeTableDisplay.tblNoLnk
                              ? intl
                                  .get('custom_plugin.disable_noLinks')
                                  .d(`${d.custom_plugin.disable_noLinks}`) +
                                ' "' +
                                intl
                                  .get('custom_plugin.tbl_noLinks')
                                  .d(`${d.custom_plugin.tbl_noLinks}`) +
                                '"'
                              : ''
                          }
                          style={{
                            cursor:
                              filterTablesWithoutLinks(allTables).includes(t) &&
                              !activeTableDisplay.tblNoLnk
                                ? 'not-allowed'
                                : 'pointer',
                            marginLeft: 'auto',
                            marginTop: 'auto',
                            marginBottom: 'auto',
                          }}
                          /*className={`${
                            activeTableDisplay.displayedTables?.includes(t?._id) &&
                            (activeRelationships.tblNoLnk ||
                              (!activeRelationships.tblNoLnk &&
                                !filterTablesWithoutLinks(allTables).includes(t)))
                              ? stylesPSettings.settings_fields_toggle_btns_active
                              : stylesPSettings.settings_fields_toggle_btns
                          }`}*/
                          className={`${
                            activeTableDisplay.displayedTables?.includes(t?._id)
                              ? stylesPSettings.settings_fields_toggle_btns_active
                              : stylesPSettings.settings_fields_toggle_btns
                          }`}
                          disabled={
                            filterTablesWithoutLinks(allTables).includes(t) &&
                            !activeTableDisplay.tblNoLnk
                          }></button>
                      </ContainerHeader>
                      <ContainerContent>
                        <p className="d-inline mb-2 mt-0">{intl.get('view').d(`${d.view}`)}</p>
                        <DtableSelect
                          value={
                            activeTableDisplay.selectedViews &&
                            t._id in activeTableDisplay.selectedViews
                              ? {
                                  value: t.views
                                    .filter((v) => v.type === 'table')
                                    .filter(
                                      (v) => v._id === activeTableDisplay.selectedViews[t._id]
                                    )[0]._id,
                                  label: t.views
                                    .filter((v) => v.type === 'table')
                                    .filter(
                                      (v) => v._id === activeTableDisplay.selectedViews[t._id]
                                    )[0].name,
                                }
                              : t.views
                                  .filter((v) => v.type === 'table')
                                  .map((v) => {
                                    let viewOption = { value: v._id, label: v.name };
                                    return viewOption;
                                  })[0]
                          }
                          options={t.views
                            .filter((v) => v.type === 'table')
                            .map((v) => {
                              let viewOption = { value: v._id, label: v.name };
                              return viewOption;
                            })}
                          onChange={(
                            newValue: SingleValue<{
                              value: string;
                              label: string;
                            }>
                          ) => {
                            if (newValue) {
                              handleTableDisplays({
                                ...activeTableDisplay,
                                selectedViews: {
                                  ...activeTableDisplay.selectedViews,
                                  [t._id]: newValue.value,
                                },
                              });
                            }
                          }}
                          isDisabled={
                            !activeTableDisplay.displayedTables?.includes(t?._id) ||
                            activeTableDisplay.tblAllCols
                          }
                          key={t?._id + 'DtableSelect'}
                        />
                      </ContainerContent>
                    </ExpandableContainer>
                  ))}
              </div>
            </div>
          </div>
          <div className="theme-content pb-9 tab-pane">
            <ExpandableContainer>
              <ContainerHeader>
                <p className="ml-2 mb-0">
                  {intl.get('custom_plugin.title_tables').d(`${d.custom_plugin.title_tables}`)}
                </p>
              </ContainerHeader>
              <ContainerContent>
                <p>{intl.get('custom_plugin.theme_header').d(`${d.custom_plugin.theme_header}`)}</p>
                <div className="design-properties-item widget-border-color mt-2">
                  <ColorPicker
                    activeColor={previewHeaderColor ?? activeTableDisplay.headerColor}
                    onColorChanged={(selectedColor: string) => {
                      onPreviewHeaderColor(selectedColor); // preview temps réel
                    }}
                    onColorCommitted={(selectedColor: string) => {
                      onPreviewHeaderColor(null);
                      handleTableDisplays({
                        ...activeTableDisplay,
                        headerColor: selectedColor,
                      });
                    }}
                    readOnly={false}
                    /* activeColor={activeTableDisplay.headerColor}
                    onColorChanged={(selectedColor: string) =>
                      handleTableDisplays({
                        ...activeTableDisplay,
                        headerColor: selectedColor,
                      })
                    }
                    readOnly={false}*/
                  />
                </div>
                <p className="mt-3 mb-2">
                  {intl.get('custom_plugin.theme_fontsize').d(`${d.custom_plugin.theme_fontsize}`)}
                </p>
                <PixelEditor
                  readOnly={false}
                  pixel={activeTableDisplay.fontSize}
                  modifyPixel={(e) => {
                    handleTableDisplays({
                      ...activeTableDisplay,
                      fontSize: parseInt(e),
                    });
                  }}
                />
              </ContainerContent>
            </ExpandableContainer>
            <ExpandableContainer>
              <ContainerHeader>
                <p className="ml-2 mb-0">
                  {intl.get('custom_plugin.theme_links').d(`${d.custom_plugin.theme_links}`)}
                </p>
              </ContainerHeader>
              <ContainerContent>
                <p>
                  {intl
                    .get('custom_plugin.theme_linewidth')
                    .d(`${d.custom_plugin.theme_linewidth}`)}
                </p>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={activeTableDisplay.edgeStrokes?.link.strokeWidth}
                  onChange={(e) => {
                    if (typeof activeTableDisplay.edgeStrokes !== 'undefined') {
                      handleTableDisplays({
                        ...activeTableDisplay,
                        edgeStrokes: {
                          ...activeTableDisplay.edgeStrokes,
                          link: {
                            ...activeTableDisplay.edgeStrokes.link,
                            strokeWidth: parseInt(e.currentTarget.value),
                          },
                        },
                      });
                    }
                  }}
                  className={'table-relationships-plugin-slider w-50 mb-3 mt-2'}></input>
                <p>
                  {intl
                    .get('custom_plugin.theme_linedasharray')
                    .d(`${d.custom_plugin.theme_linedasharray}`)}
                </p>
                <Select
                  value={LineStyleOptions.find(
                    (l) =>
                      l.value ===
                      normalizeStrokeDasharray(activeTableDisplay.edgeStrokes.link.strokeDasharray)
                  )}
                  options={LineStyleOptions}
                  onChange={(e: any) => {
                    if (typeof activeTableDisplay.edgeStrokes !== 'undefined') {
                      handleTableDisplays({
                        ...activeTableDisplay,
                        edgeStrokes: {
                          ...activeTableDisplay.edgeStrokes,
                          link: {
                            ...activeTableDisplay.edgeStrokes.link,
                            strokeDasharray: e.value,
                          },
                        },
                      });
                    }
                  }}
                  styles={lineStyles}
                  className={'mt-2'}
                />
                <p className="mt-3">
                  {intl
                    .get('custom_plugin.theme_linecolor')
                    .d(`${d.custom_plugin.theme_linecolor}`)}
                </p>
                <div className="design-properties-item widget-border-color mt-2">
                  <ColorPicker
                    activeColor={activeTableDisplay.edgeStrokes.link.stroke}
                    onColorChanged={(selectedColor: string) => {
                      if (typeof activeTableDisplay.edgeStrokes !== 'undefined') {
                        handleTableDisplays({
                          ...activeTableDisplay,
                          edgeStrokes: {
                            ...activeTableDisplay.edgeStrokes,
                            link: {
                              ...activeTableDisplay.edgeStrokes.link,
                              stroke: selectedColor,
                            },
                          },
                        });
                      }
                    }}
                    readOnly={false}
                  />
                </div>
              </ContainerContent>
            </ExpandableContainer>
            <ExpandableContainer>
              <ContainerHeader>
                <p className="ml-2 mb-0">
                  {intl.get('custom_plugin.theme_formula').d(`${d.custom_plugin.theme_formula}`)}
                </p>
              </ContainerHeader>
              <ContainerContent>
                <p>
                  {intl
                    .get('custom_plugin.theme_linewidth')
                    .d(`${d.custom_plugin.theme_linewidth}`)}
                </p>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={activeTableDisplay.edgeStrokes?.formula.strokeWidth}
                  onChange={(e) => {
                    if (typeof activeTableDisplay.edgeStrokes !== 'undefined') {
                      handleTableDisplays({
                        ...activeTableDisplay,
                        edgeStrokes: {
                          ...activeTableDisplay.edgeStrokes,
                          formula: {
                            ...activeTableDisplay.edgeStrokes.formula,
                            strokeWidth: parseInt(e.currentTarget.value),
                          },
                        },
                      });
                    }
                  }}
                  className={'table-relationships-plugin-slider w-50 mb-3 mt-2'}></input>
                <p>
                  {intl
                    .get('custom_plugin.theme_linedasharray')
                    .d(`${d.custom_plugin.theme_linedasharray}`)}
                </p>
                <Select
                  value={LineStyleOptions.find(
                    (l) =>
                      l.value ===
                      normalizeStrokeDasharray(
                        activeTableDisplay.edgeStrokes.formula.strokeDasharray
                      )
                  )}
                  options={LineStyleOptions}
                  onChange={(e: any) => {
                    if (typeof activeTableDisplay.edgeStrokes !== 'undefined') {
                      handleTableDisplays({
                        ...activeTableDisplay,
                        edgeStrokes: {
                          ...activeTableDisplay.edgeStrokes,
                          formula: {
                            ...activeTableDisplay.edgeStrokes.formula,
                            strokeDasharray: e.value,
                          },
                        },
                      });
                    }
                  }}
                  styles={lineStyles}
                  className={'mt-2'}
                />
                <p className="mt-3">
                  {intl
                    .get('custom_plugin.theme_linecolor')
                    .d(`${d.custom_plugin.theme_linecolor}`)}
                </p>
                <div className="design-properties-item widget-border-color mt-2">
                  <ColorPicker
                    activeColor={activeTableDisplay.edgeStrokes.formula.stroke}
                    onColorChanged={(selectedColor: string) => {
                      if (typeof activeTableDisplay.edgeStrokes !== 'undefined') {
                        handleTableDisplays({
                          ...activeTableDisplay,
                          edgeStrokes: {
                            ...activeTableDisplay.edgeStrokes,
                            formula: {
                              ...activeTableDisplay.edgeStrokes.formula,
                              stroke: selectedColor,
                            },
                          },
                        });
                      }
                    }}
                    readOnly={false}
                  />
                </div>
              </ContainerContent>
            </ExpandableContainer>
            <ExpandableContainer>
              <ContainerHeader>
                <p className="ml-2 mb-0">
                  {intl
                    .get('custom_plugin.theme_formula2nd')
                    .d(`${d.custom_plugin.theme_formula2nd}`)}
                </p>
              </ContainerHeader>
              <ContainerContent>
                <p>
                  {intl
                    .get('custom_plugin.theme_linewidth')
                    .d(`${d.custom_plugin.theme_linewidth}`)}
                </p>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={activeTableDisplay.edgeStrokes?.formula2nd.strokeWidth}
                  onChange={(e) => {
                    if (typeof activeTableDisplay.edgeStrokes !== 'undefined') {
                      handleTableDisplays({
                        ...activeTableDisplay,
                        edgeStrokes: {
                          ...activeTableDisplay.edgeStrokes,
                          formula2nd: {
                            ...activeTableDisplay.edgeStrokes.formula2nd,
                            strokeWidth: parseInt(e.currentTarget.value),
                          },
                        },
                      });
                    }
                  }}
                  className={'table-relationships-plugin-slider w-50 mb-3 mt-2'}></input>
                <p>
                  {intl
                    .get('custom_plugin.theme_linedasharray')
                    .d(`${d.custom_plugin.theme_linedasharray}`)}
                </p>
                <Select
                  value={LineStyleOptions.find(
                    (l) =>
                      l.value ===
                      normalizeStrokeDasharray(
                        activeTableDisplay.edgeStrokes.formula2nd.strokeDasharray
                      )
                  )}
                  options={LineStyleOptions}
                  onChange={(e: any) => {
                    if (typeof activeTableDisplay.edgeStrokes !== 'undefined') {
                      handleTableDisplays({
                        ...activeTableDisplay,
                        edgeStrokes: {
                          ...activeTableDisplay.edgeStrokes,
                          formula2nd: {
                            ...activeTableDisplay.edgeStrokes.formula2nd,
                            strokeDasharray: e.value,
                          },
                        },
                      });
                    }
                  }}
                  styles={lineStyles}
                  className={'mt-2'}
                />
                <p className="mt-3">
                  {intl
                    .get('custom_plugin.theme_linecolor')
                    .d(`${d.custom_plugin.theme_linecolor}`)}
                </p>
                <div className="design-properties-item widget-border-color mt-2">
                  <ColorPicker
                    activeColor={activeTableDisplay.edgeStrokes.formula2nd.stroke}
                    onColorChanged={(selectedColor: string) => {
                      if (typeof activeTableDisplay.edgeStrokes !== 'undefined') {
                        handleTableDisplays({
                          ...activeTableDisplay,
                          edgeStrokes: {
                            ...activeTableDisplay.edgeStrokes,
                            formula2nd: {
                              ...activeTableDisplay.edgeStrokes.formula2nd,
                              stroke: selectedColor,
                            },
                          },
                        });
                      }
                    }}
                    readOnly={false}
                  />
                </div>
              </ContainerContent>
            </ExpandableContainer>
            <ExpandableContainer>
              <ContainerHeader>
                <p className="ml-2 mb-0">
                  {intl
                    .get('custom_plugin.theme_setbgcolor')
                    .d(`${d.custom_plugin.theme_setbgcolor}`)}
                </p>
                <button
                  onClick={() => {
                    handleTableDisplays({
                      ...activeTableDisplay,
                      isBackground: !activeTableDisplay.isBackground,
                    });
                  }}
                  style={{
                    marginLeft: 'auto',
                    marginTop: 'auto',
                    marginBottom: 'auto',
                  }}
                  className={`${
                    activeTableDisplay.isBackground
                      ? stylesPSettings.settings_fields_toggle_btns_active
                      : stylesPSettings.settings_fields_toggle_btns
                  }`}></button>
              </ContainerHeader>
              <ContainerContent>
                <p>
                  {intl.get('custom_plugin.theme_bgcolor').d(`${d.custom_plugin.theme_bgcolor}`)}
                </p>
                <div
                  className="design-properties-item widget-border-color"
                  title={
                    !activeTableDisplay.isBackground
                      ? intl
                          .get('custom_plugin.enable_background')
                          .d(`${d.custom_plugin.enable_background}`) +
                        ' "' +
                        intl
                          .get('custom_plugin.theme_setbgcolor')
                          .d(`${d.custom_plugin.theme_setbgcolor}`) +
                        '"'
                      : ''
                  }>
                  <ColorPicker
                    activeColor={activeTableDisplay.backgroundColor}
                    onColorChanged={(selectedColor: string) => {
                      handleTableDisplays({
                        ...activeTableDisplay,
                        backgroundColor: selectedColor,
                      });
                    }}
                    readOnly={!activeTableDisplay.isBackground}
                  />
                </div>
              </ContainerContent>
            </ExpandableContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PluginSettings;
