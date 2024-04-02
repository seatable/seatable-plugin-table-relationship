import * as d3 from 'd3';
import { RELATIONSHIPS } from './constants';
import {
  EntityCoordinates,
  LineCoordinate,
  Relationship,
} from '../Interfaces/custom-interfaces/ERDPlugin';
import { useState } from 'react';
import useCoordinatesMap from './customHooks';

export const stringGeneratorBase64Code = (keyLength = 4) => {
  let key = '';
  for (let i = 0; i < keyLength; i++) {
    const POSSIBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    key += POSSIBLE.charAt(Math.floor(Math.random() * POSSIBLE.length));
  }
  return key;
};

export function CreateNodeWithDrag(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  entities: any[]
): any {
  const entitiesCoordinates: any[] = [];

  const shapesGroupArray = entities.map((entity, index) => {
    const firstTopSxPivot = 30;
    const firstColTxtPivot = firstTopSxPivot + 15;
    const secondColTxtPivot = firstColTxtPivot + 100;
    const nodeWidth = 150;
    const nodeRectHeight = 30;
    const shapeGroup = svg.append('g');
    const nOfAttributes = Object.keys(entity.eAttributes).length;
    let yOffset = 80;

    shapeGroup // Create the group
      .append('rect')
      .attr('x', firstTopSxPivot + index * 200)
      .attr('y', firstTopSxPivot)
      .attr('width', nodeWidth)
      .attr('height', nOfAttributes * 30 + 30)
      .style('fill', 'none')
      .attr('id', entity.eTitle);

    shapeGroup // Create the Header Title Rectangle
      .append('rect')
      .attr('x', firstTopSxPivot + index * 200)
      .attr('y', firstTopSxPivot)
      .attr('width', nodeWidth)
      .attr('height', nodeRectHeight)
      .style('fill', 'rgb(0, 83, 155)');

    shapeGroup // Create the Header Title Text
      .append('text')
      .attr('x', firstTopSxPivot * 2 + index * 200)
      .attr('y', 48)
      .text(entity.eTitle)
      .style('fill', 'white');

    shapeGroup // Create the Rectangle for the attributes
      .append('rect')
      .attr('x', firstTopSxPivot + index * 200)
      .attr('y', 60)
      .attr('width', nodeWidth)
      .attr('height', nOfAttributes * nodeRectHeight)
      .style('fill', 'lightgray');

    Object.entries(entity.eAttributes).forEach(([key, value]) => {
      shapeGroup
        .append('text')
        .attr('x', firstColTxtPivot + index * 200)
        .attr('y', yOffset)
        .text(`${key}:`)
        .style('fill', 'black')
        .attr('id', key);

      shapeGroup
        .append('text')
        .attr('x', secondColTxtPivot + index * 200)
        .attr('y', yOffset)
        .text(String(value))
        .style('fill', 'black');

      const coordinate = {
        title: entity.eTitle,
        attrKey: key,
        x: firstColTxtPivot - 15 + index * 200,
        y: yOffset - 5,
      };

      entitiesCoordinates.push(coordinate);
      const groupedEntities: any = {};

      entitiesCoordinates.forEach((entity) => {
        if (!groupedEntities[entity.title]) {
          groupedEntities[entity.title] = {
            title: entity.title,
            attributes: [],
          };
        }
        groupedEntities[entity.title].attributes.push({
          attrKey: entity.attrKey,
          x: entity.x,
          y: entity.y,
        });
      });

      const resultArray = Object.values(groupedEntities);

      yOffset += 30;
    });

    return shapeGroup;
  });

  drawNodeLines(svg, entities, entitiesCoordinates, 'draw', Object.keys(entitiesCoordinates[0])[0]);
  return { shapesGroupArray, entitiesCoordinates };
}

const updatedCoordinatesMap: Map<string, { x: number; y: number }> = new Map();

export function drawNodeLines(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  entities: any[],
  entitiesCoordinates: any[],
  type: string,
  entityTarget: string,
  newCoordinates?: { newX: number; newY: number },
  lineCoordinatesRef?: LineCoordinate[] // Pass lineCoordinates as a reference
): LineCoordinate[] {
  const line = d3
    .line<any>()
    .x((d) => d.date)
    .y((d) => d.value)
    .curve(d3.curveNatural);

  let lineCoordinates: LineCoordinate[]; // Declare lineCoordinates variable

  if (lineCoordinatesRef) {
    // console.log(0, lineCoordinatesRef);
    // If lineCoordinatesRef is provided, use it
    lineCoordinates = lineCoordinatesRef;
  } else {
    // Otherwise, initialize lineCoordinates
    lineCoordinates = findLineCoordinates(RELATIONSHIPS, entitiesCoordinates);
  }

  switch (type) {
    case 'draw':
      // Loop through lineCoordinates array and draw lines
      lineCoordinates.forEach(({ node1, node2, line_id }, key) => {
        const startX = node1.x1;
        const startY = node1.y1;
        const endX = node2.x2;
        const endY = node2.y2;
        const lineData = [
          { date: startX, value: startY }, // Start point
          { date: endX, value: endY }, // End point
        ];

        svg
          .append('path')
          .attr('d', line(lineData))
          .attr('stroke', 'black')
          .attr('stroke-width', 2)
          .attr('fill', 'none')
          .attr('id', line_id);
      });
      break;
    case 'update':
      // Updating logic

      // Filter lineCoordinates based on the dragged entity's title
      const filteredLineCoordinates = lineCoordinates.filter(
        (coordinate) =>
          coordinate.node1.title === entityTarget || coordinate.node2.title === entityTarget
      );

      // Loop through filtered lineCoordinates and update lines
      filteredLineCoordinates.forEach(({ node1, node2, line_id }) => {
        // Calculate updated coordinates based on the drag
        let updatedNode1X = node1.x1;
        let updatedNode1Y = node1.y1;
        let updatedNode2X = node2.x2;
        let updatedNode2Y = node2.y2;

        // Adjust the coordinates if the entity is being dragged
        if (node1.title === entityTarget) {
          updatedNode1X += newCoordinates?.newX!;
          updatedNode1Y += newCoordinates?.newY!;
        }
        if (node2.title === entityTarget) {
          updatedNode2X += newCoordinates?.newX!;
          updatedNode2Y += newCoordinates?.newY!;
        }

        const lineData = [
          { date: updatedNode1X, value: updatedNode1Y }, // Updated start point
          { date: updatedNode2X, value: updatedNode2Y }, // Updated end point
        ];

        // Select the existing line by its ID and update its d attribute
        svg.select(`#${line_id}`).attr('d', line(lineData));

        // Update lineCoordinates array with new coordinates
        const index = lineCoordinates.findIndex((coord) => coord.line_id === line_id);
        if (index !== -1) {
          // console.log('if');
          // If line_id is found in lineCoordinates, update its coordinates
          lineCoordinates[index].node1.x1 = updatedNode1X;
          lineCoordinates[index].node1.y1 = updatedNode1Y;
          lineCoordinates[index].node2.x2 = updatedNode2X;
          lineCoordinates[index].node2.y2 = updatedNode2Y;
        }
        // console.log(lineCoordinates);
      });

      break;
    default:
      console.error('Invalid type:', type);
      break;
  }
  return lineCoordinates;
}

export function findLineCoordinates(
  relationships: Relationship[],
  entitiesCoordinates: EntityCoordinates[]
): LineCoordinate[] {
  const lineCoordinates: LineCoordinate[] = [];
  for (const relationship of relationships) {
    const { node1, node2 } = relationship;

    // Find node1 coordinates
    const node1Coordinates = entitiesCoordinates.find(
      (entity) => entity.title === node1.title && entity.attrKey === node1.attrKey
    );

    // Find node2 coordinates
    const node2Coordinates = entitiesCoordinates.find(
      (entity) => entity.title === node2.title && entity.attrKey === node2.attrKey
    );

    // If either node coordinates are not found, skip this relationship
    if (!node1Coordinates || !node2Coordinates) {
      continue;
    }

    // Append line coordinates
    lineCoordinates.push({
      line_id: relationship.id,
      node1: {
        title: node1.title,
        attrKey: node1.attrKey,
        x1: node1Coordinates.x,
        y1: node1Coordinates.y,
      },
      node2: {
        title: node2.title,
        attrKey: node2.attrKey,
        x2: node2Coordinates.x,
        y2: node2Coordinates.y,
      },
    });
  }

  return lineCoordinates;
}
