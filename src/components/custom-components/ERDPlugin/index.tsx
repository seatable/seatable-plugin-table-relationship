import React, { useEffect, useRef, useState } from 'react';
import styles from '../../../styles/custom-styles/ERDPlugin.module.scss';
import * as d3 from 'd3';
import { IERDPluginProps, Rectangle } from '../../../utils/Interfaces/custom-interfaces/ERDPlugin';
import {
  CreateNodeWithDrag,
  drawNodeLines,
  findLineCoordinates,
} from '../../../utils/customUtils/ERDUtils';
import { RELATIONSHIPS } from '../../../utils/customUtils/constants';

const ERDPlugin: React.FC<IERDPluginProps> = ({ entities }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

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

    const { shapesGroupArray, entitiesCoordinates } = CreateNodeWithDrag(svg, entities);
    // Add drag event to the shapes
    shapesGroupArray.map((shapeGroup: any, index: number) => {
      shapeGroup.call(
        d3
          .drag<any, unknown>()
          .subject(function (event) {
            const groupElement: SVGGElement = this;
            const transform = groupElement.transform.baseVal.consolidate();
            return { x: transform ? transform.matrix.e : 0, y: transform ? transform.matrix.f : 0 };
          })
          .on('start', function (e) {
            console.log('e', e);
          })
          .on('drag', function (event) {
            const groupElement: any = d3.select(this);
            const targetId: Element = groupElement._groups[0][0].querySelector('*:first-child').id;
            const newX = event.x;
            const newY = event.y;

            groupElement.attr('x', newX).attr('y', newY);
            groupElement.attr('transform', `translate(${newX}, ${newY})`);
            const lineCoordinates = findLineCoordinates(RELATIONSHIPS, entitiesCoordinates);
            console.log('findLineCoordinates', lineCoordinates);
            drawNodeLines(svg, entities, entitiesCoordinates, 'update', String(targetId), {
              newX,
              newY,
            });
          })
      );
    });
  }, []);

  return <svg ref={svgRef} className={styles.custom}></svg>;
};

export default ERDPlugin;
