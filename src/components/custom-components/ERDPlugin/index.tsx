import React from 'react';
import stylesCustomP from '../../../styles/custom-styles/CustomPlugin.module.scss';
import { IERDPluginProps } from '../../../utils/Interfaces/custom-interfaces/ERDPlugin';
import { IPresetInfo } from '../../../utils/Interfaces/template-interfaces/PluginPresets/Presets.interface';

const ERDPlugin: React.FC<IERDPluginProps> = ({
  pluginPresets,
  appActiveState,
  activeViewRows,
}) => (
  <div className={stylesCustomP.custom}>
    <div>Here are the listed presets for the plugin</div>
  </div>
);

export default ERDPlugin;
