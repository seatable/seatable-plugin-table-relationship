import React from 'react';
import stylesCustom from '../../../styles/custom-styles/ERDPlugin.module.scss';
import { ITableVisualizationProps } from '../../../utils/custom-interfaces/ERDPlugin';

const TableVisualization: React.FC<ITableVisualizationProps> = ({ appActiveState }) => {
  const { activeTable } = appActiveState;

  return (
    <div className={stylesCustom.custom_tableVisual}>
      <p>{activeTable?.name}</p>
    </div>
  );
};

export default TableVisualization;
