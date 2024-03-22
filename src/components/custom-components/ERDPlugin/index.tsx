import React, { useEffect, useRef, useState } from 'react';
import styles from '../../../styles/custom-styles/ERDPlugin.module.scss';
import * as d3 from 'd3';
import { IERDPluginProps, Rectangle } from '../../../utils/Interfaces/custom-interfaces/ERDPlugin';
import { createNodeWithDrag } from '../../../utils/ERDUtils';

const ERDPlugin: React.FC<IERDPluginProps> = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [nodes, setNodes] = useState<Rectangle[]>([]);

  const entities: any = [
    {
      eTitle: 'order_items',
      eAttributes: {
        order_id: 11,
        product_id: 109123986,
        quantity: 10,
      },

      links: { eTitle: 'orders', orders_id: 2 },
    },
    {
      eTitle: 'orders',
      eAttributes: {
        id: 2,
        user_id: 23,
        status: 'open',
        created_at: '2024-12-12',
      },

      links: { eTitle: 'order_items', order_id: 11 },
    },
  ];

  useEffect(() => {
    if (!svgRef.current) return;
    // Create the SVG
    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3.select(svgRef.current);
    const width = Math.round(parseFloat(svg.style('width').replace('px', '')));
    const height = Math.round(parseFloat(svg.style('height').replace('px', '')));

    var shapeGroup2 = svg.append('g');
    const shapesGroupArray = createNodeWithDrag(svg, entities);

    // Append a line connecting the two center points
    // const line = svg.append('line').attr('stroke', 'black').attr('stroke-width', 1);

    // function updateLinePosition() {
    //   // const rect1CenterX = +shapeGroup.attr('x') + 150 / 2;
    //   // const rect1CenterY = +shapeGroup.attr('y') + 150 / 2;
    //   const rect2CenterX = +shapeGroup2.attr('x') + 150 / 2;
    //   const rect2CenterY = +shapeGroup2.attr('y') + 150 / 2;

    //   // line
    //   //   .attr('x1', rect1CenterX)
    //   //   .attr('y1', rect1CenterY)
    //     // .attr('x2', rect2CenterX)
    //     // .attr('y2', rect2CenterY);
    // }

    // Initial positioning of the line
    // updateLinePosition();
  }, []);

  return <svg ref={svgRef} className={styles.custom}></svg>;
};

export default ERDPlugin;
