import React, { useEffect, useRef, useState } from 'react';
import styles from '../../../styles/custom-styles/ERDPlugin.module.scss';
import * as d3 from 'd3';
import {
  IERDPluginProps,
  LineCoordinate,
} from '../../../utils/Interfaces/custom-interfaces/ERDPlugin';
import { CreateNodeWithDrag, findLineCoordinates } from '../../../utils/customUtils/ERDUtils';
import { RELATIONSHIPS } from '../../../utils/customUtils/constants';

const ERDPlugin: React.FC<IERDPluginProps> = ({ entities }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [nodes, setNodes] = useState<LineCoordinate[]>([]);

  useEffect(() => {}, []);

  useEffect(() => {
    console.log('node updated', nodes);
  }, [nodes]);

  return <svg ref={svgRef} className={styles.custom}></svg>;
};

export default ERDPlugin;
