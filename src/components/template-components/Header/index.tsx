import React, { useState, useEffect } from 'react';
import styles from '../../../styles/template-styles/Plugin.module.scss';
import stylesPPresets from '../../../styles/template-styles/PluginPresets.module.scss';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';
import { IHeaderProps } from '../../../utils/template-interfaces/Header.interface';
import { PLUGIN_ID, PLUGIN_NAME } from '../../../utils/template-constants';
import { HiOutlineChevronDoubleRight } from 'react-icons/hi2';

import { useReactFlow } from 'reactflow';

const Header: React.FC<IHeaderProps> = (props) => {
  const { presetName, isShowPresets, onTogglePresets, togglePlugin } = props;
  const [customComponentContent, setCustomComponentContent] = useState<string | null>(null);
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    const input = document.getElementById(PLUGIN_ID);
    if (input) {
      setCustomComponentContent(input.innerHTML);
    }
  }, []);

  const downloadPdfDocument = () => {
    const input = document.getElementById(PLUGIN_NAME);

    // Step 1: Capture component as an image
    htmlToImage
      .toPng(input as HTMLElement)
      .then(function (dataUrl) {
        // Step 2: Convert image to PDF
        const img = new Image();
        img.src = dataUrl;
        img.onload = function () {
          const pdf = new jsPDF('l', 'mm', [420, 297]);

          // Step 3: Add background color to the entire PDF
          pdf.setFillColor('#f5f5f5');
          pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');

          // Step 4: Add image to PDF
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();

          const imgWidth = pdfWidth;
          const imgHeight = (img.height * imgWidth) / img.width;
          const yPos = (pdfHeight - imgHeight) / 2;

          pdf.addImage(dataUrl, 'PNG', 0, yPos, imgWidth, imgHeight);

          // Step 5: Download PDF
          pdf.save(`${presetName}.pdf`);
        };
      })
      .catch(function (error) {
        console.error('Oops, something went wrong!', error);
      });
  };

  function onToggleView() {
    reactFlowInstance.fitView();
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
          <span className="dtable-font dtable-icon-full-screen"></span>
        </span>
        <span className={styles.plugin_header_icon_btn} onClick={downloadPdfDocument}>
          <span className="dtable-font dtable-icon-download"></span>
        </span>
        {/* <span className={styles.plugin_header_icon_btn} onClick={printPdfDocument}>
          <span className="dtable-font dtable-icon-print"></span>
        </span> */}
        <span className={styles.plugin_header_icon_btn} onClick={togglePlugin}>
          <span className="dtable-font dtable-icon-x btn-close"></span>
        </span>
      </div>
    </div>
  );
};

export default Header;
