import React, { useEffect, useRef, useState } from 'react';
import styles from '../../../styles/custom-styles/ERDPlugin.module.scss';
import * as d3 from 'd3';
import { IERDPluginProps, Rectangle } from '../../../utils/Interfaces/custom-interfaces/ERDPlugin';
import { createNodeWithDrag } from '../../../utils/customUtils/ERDUtils';

const ERDPlugin: React.FC<IERDPluginProps> = ({ entities }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [entitiesCoordinates, setEntitiesCoordinates] = useState<any[]>([]);
  const [nodes, setNodes] = useState<Rectangle[]>([]);

  useEffect(() => {
    if (!svgRef.current) return;
    // Create the SVG
    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3.select(svgRef.current);
    const width = Math.round(parseFloat(svg.style('width').replace('px', '')));
    const height = Math.round(parseFloat(svg.style('height').replace('px', '')));

    function handleZoom(e: any) {}

    const zoom: any = d3.zoom().on('zoom', handleZoom);

    d3.select('svg').call(zoom);

    const { shapesGroupArray, entitiesCoordinates } = createNodeWithDrag(svg, entities);
    setEntitiesCoordinates(entitiesCoordinates);
  }, []);

  return <svg ref={svgRef} className={styles.custom}></svg>;
};

export default ERDPlugin;
