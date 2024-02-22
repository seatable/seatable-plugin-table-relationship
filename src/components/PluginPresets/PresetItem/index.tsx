import React, { useEffect, useState } from 'react';
import { BsThreeDots } from 'react-icons/bs';

import styles from '../../../styles/Modal.module.scss';
import '../../../assets/css/plugin-layout.css';

import PresetDropdown from '../PresetDropdown';
import useClickOut from '../../../hooks/useClickOut';
import { IPresetItemProps } from '../../../utils/Interfaces/PluginPresets/Item.interface';
import PresetInput from '../PresetInput';
import { PresetHandleAction } from '../../../utils/constants';

const PresetItem: React.FC<IPresetItemProps> = ({
  v,
  activePresetIdx,
  presetName,
  pluginPresets,
  onChangePresetName,
  deletePreset,
  onSelectPreset,
  duplicatePreset,
  togglePresetsUpdate,
  onEditPresetSubmit,
  onToggleSettings,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  let popupDomNode = useClickOut(() => {
    setShowPresetDropdown(false);
  });

  // toggle Preset dropdown(edit/delete)
  const togglePresetDropdown = () => {
    setShowPresetDropdown((prev) => !prev);
  };

  const editOnEnterKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onEditPresetSubmit();
    }
  };

  // Update a Preset
  const handlePresetsUpdate = (e: React.MouseEvent<HTMLElement>) => {
    const action = e.currentTarget.id;
    switch (action) {
      case PresetHandleAction.delete:
        deletePreset();
        togglePresetDropdown();
        break;
      case PresetHandleAction.rename:
        setIsEditing((prev) => !prev);
        togglePresetsUpdate(e, PresetHandleAction.edit);
        togglePresetDropdown();
        setShowPresetDropdown(false);
        break;
      case PresetHandleAction.duplicate:
        duplicatePreset(v);
        setShowPresetDropdown(false);
        break;
      default:
    }
  };

  const onClickPreset = (e: React.MouseEvent<HTMLElement>) => {
    if (e.detail === 2) {
      handlePresetsUpdate(e);
    } else {
      onSelectPreset(v?._id);
    }
  };

  return (
    <div>
      <PresetInput
        onChangePresetName={onChangePresetName}
        onEditPresetSubmit={onEditPresetSubmit}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        presetName={presetName}
      />
      <div style={{ position: 'relative' }}>
        <div
          onClick={onClickPreset}
          style={{ display: isEditing ? 'none' : 'flex' }}
          className={
            pluginPresets[activePresetIdx]?._id === v?._id
              ? styles.modal_header_viewBtn_active
              : styles.modal_header_viewBtn
          }>
          <div className="d-flex align-items-center">
            <p className="mb-0">{v.name}</p>
          </div>
          <span>
            <span><i className={`dtable-font dtable-icon-drag ${styles.modal_header_viewBtn_icons} mr-1`}></i></span>
            <span
              className={`dtable-font dtable-icon-set-up ${styles.modal_header_viewBtn_settings}`}
              onClick={onToggleSettings}></span>
            <BsThreeDots
              className={styles.modal_header_viewBtn_icons}
              onClick={togglePresetDropdown}
            />
          </span>
        </div>
        {showPresetDropdown && (
          <PresetDropdown
            dropdownRef={popupDomNode}
            pluginPresets={pluginPresets}
            togglePresetsUpdatePopUp={handlePresetsUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default PresetItem;
