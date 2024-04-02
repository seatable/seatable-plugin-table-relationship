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

    // Create the nodes (Rectangles and Texts)
    const { shapesGroupArray, entitiesCoordinates } = CreateNodeWithDrag(svg, entities);

    // Create the lines
    const _nodes = findLineCoordinates(RELATIONSHIPS, entitiesCoordinates);
    setNodes(_nodes);
    const n = _nodes || nodes;
    // Create a horizontal link from the first node to the second
    // d3.linkHorizontal();
    const link = d3.linkHorizontal()({
      source: [n[0].node1.x1, n[0].node1.y1],
      target: [n[0].node2.x2, n[0].node2.y2],
    });

    // Append the link to the svg element
    svg.append('path').attr('d', link).attr('stroke', 'black').attr('fill', 'none');

    // Drag Function
    const dragFn = function (this: any, event: any, d: any) {
      const groupElement: any = d3.select(this);
      const targetId: Element = groupElement._groups[0][0].querySelector('*:first-child').id;
      const newX = event.x;
      const newY = event.y;

      groupElement.attr('x', newX).attr('y', newY);
      groupElement.attr('transform', `translate(${newX}, ${newY})`);
      const lineCoordinates = findLineCoordinates(RELATIONSHIPS, entitiesCoordinates);
      setNodes(lineCoordinates);
    };

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
          .on('drag', dragFn)
      );
    });
    //
  }, []);

  useEffect(() => {
    console.log('node updated', nodes);
  }, [nodes]);

  return <svg ref={svgRef} className={styles.custom}></svg>;
};

export default ERDPlugin;
