import React, { useState, useEffect } from 'react';
import styles from '../../../styles/template-styles/Plugin.module.scss';
import stylesPPresets from '../../../styles/template-styles/PluginPresets.module.scss';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { IHeaderProps } from '../../../utils/Interfaces/template-interfaces/Header.interface';
import { PLUGIN_ID } from '../../../utils/constants';
import { HiOutlineChevronDoubleRight } from 'react-icons/hi2';

const Header: React.FC<IHeaderProps> = (props) => {
  const { presetName, isShowPresets, onTogglePresets, togglePlugin } = props;
  const [customComponentContent, setCustomComponentContent] = useState<string | null>(null);

  useEffect(() => {
    const input = document.getElementById(PLUGIN_ID);
    if (input) {
      setCustomComponentContent(input.innerHTML);
    }
  }, []);

  const printPdfDocument = () => {
    const originalContents = document.body.innerHTML;
    // document.body.innerHTML = customComponentContent || '';
    window.print();
    // document.body.innerHTML = originalContents;
  };

  const downloadPdfDocument = () => {
    const input = document.getElementById(PLUGIN_ID);
    if (input) {
      html2canvas(input, {
        logging: true,
        allowTaint: false,
        useCORS: true,
      }).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4', true);
        pdf.addImage(imgData, 'JPEG', 0, 0, 230, 200);
        pdf.save(`${PLUGIN_ID} .pdf`);
      });
    }
  };

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
        <span className={styles.plugin_header_icon_btn} onClick={downloadPdfDocument}>
          <span className="dtable-font dtable-icon-download"></span>
        </span>
        <span className={styles.plugin_header_icon_btn} onClick={printPdfDocument}>
          <span className="dtable-font dtable-icon-print"></span>
        </span>
        <span className={styles.plugin_header_icon_btn} onClick={togglePlugin}>
          <span className="dtable-font dtable-icon-x btn-close"></span>
        </span>
      </div>
    </div>
  );
};

export default Header;
