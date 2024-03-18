import React, { useEffect, useRef, useState } from 'react';
import styles from '../../../styles/custom-styles/ERDPlugin.module.scss';
import * as d3 from 'd3';
import { IERDPluginProps, Rectangle } from '../../../utils/Interfaces/custom-interfaces/ERDPlugin';
import { generateNonOverlappingRectangles } from '../../../utils/ERDUtils';

const ERDPlugin: React.FC<IERDPluginProps> = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [nodes, setNodes] = useState<Rectangle[]>([]);

  const entities: any = [
    {
      eTitle: 'order_items',
      eAttributes: [
        {
          order_id: 11,
          product_id: 109123986,
          quantity: 10,
        },
      ],
      links: { eTitle: 'orders', orders_id: 2 },
    },
    {
      eTitle: 'orders',
      eAttributes: [
        {
          id: 2,
          user_id: 23,
          status: 'open',
          created_at: '2024-12-12',
        },
      ],
      links: { eTitle: 'order_items', order_id: 11 },
    },
  ];

  useEffect(() => {
    if (!svgRef.current) return;
    // Create the SVG
    const svg = d3.select(svgRef.current);
    const width = Math.round(parseFloat(svg.style('width').replace('px', '')));
    const height = Math.round(parseFloat(svg.style('height').replace('px', '')));

    // Generate the Rectangles with the information from the DataBase
    // const rects = generateNonOverlappingRectangles(10, width, height);
    // // Save the information of the Rectangles in the state and in the Seatable DataBase
    // setNodes(rects);
    // // TODO: Save the information of the Rectangles in the Seatable DataBase

    // // Append the SVG with the Rectangles
    // svg
    //   .selectAll('rect')
    //   .data(rects)
    //   .join('rect')
    //   .attr('x', (d) => d.x)
    //   .attr('y', (d) => d.y)
    //   .attr('width', (d) => d.width)
    //   .attr('height', (d) => d.height)
    //   .attr('fill', 'blue');
    var shapeGroup = svg.append('g');
    var shapeGroup2 = svg.append('g');

    shapeGroup
      .append('rect')
      .attr('x', 35)
      .attr('y', 25)
      .attr('width', 150)
      .attr('height', 210)
      .style('fill', 'none');

    // Append the header
    shapeGroup
      .append('rect')
      .attr('x', 35)
      .attr('y', 25)
      .attr('width', 150)
      .attr('height', 60)
      .style('fill', 'lightblue');

    shapeGroup
      .append('text')
      .attr('x', 60)
      .attr('y', 38)
      .text(entities[0].eTitle)
      .style('fill', 'black');

    shapeGroup
      .append('rect')
      .attr('x', 35)
      .attr('y', 45)
      .attr('width', 150)
      .attr('height', 150)
      .style('fill', 'lightgray');

    shapeGroup
      .append('text')
      .attr('x', 45)
      .attr('y', 88)
      .text(entities[1].eAttributes[0].id)
      .style('fill', 'black');

    shapeGroup2
      .append('rect')
      .attr('x', 200)
      .attr('y', 25)
      .attr('width', 150)
      .attr('height', 210)
      .style('fill', 'none');

    // Append the header
    shapeGroup2
      .append('rect')
      .attr('x', 200)
      .attr('y', 25)
      .attr('width', 150)
      .attr('height', 60)
      .style('fill', 'lightblue');

    shapeGroup2
      .append('text')
      .attr('x', 220)
      .attr('y', 38)
      .text(entities[1].eTitle)
      .style('fill', 'black');

    shapeGroup2
      .append('rect')
      .attr('x', 200)
      .attr('y', 45)
      .attr('width', 150)
      .attr('height', 150)
      .style('fill', 'lightgray');
    shapeGroup2
      .append('text')
      .attr('x', 210)
      .attr('y', 68)
      .text(entities[1].eAttributes[0].id)
      .style('fill', 'black');

    // Calculate the center points of the rectangles
    var rect1CenterX = 35 + 150 / 2;
    var rect1CenterY = 25 + 150 / 2;

    var rect2CenterX = 200 + 150 / 2;
    var rect2CenterY = 25 + 150 / 2;

    // Append a line connecting the two center points
    svg
      .append('line')
      .attr('x1', rect1CenterX)
      .attr('y1', rect1CenterY)
      .attr('x2', rect2CenterX)
      .attr('y2', rect2CenterY)
      .attr('stroke', 'black')
      .attr('stroke-width', 1);
  }, []);

  return <svg ref={svgRef} className={styles.custom}></svg>;
};

export default ERDPlugin;
