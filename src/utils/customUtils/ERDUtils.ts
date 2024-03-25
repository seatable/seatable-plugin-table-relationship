import * as d3 from 'd3';

export function createNodeWithDrag(
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

    shapeGroup // Create the group
      .append('rect')
      .attr('x', firstTopSxPivot + index * 200)
      .attr('y', firstTopSxPivot)
      .attr('width', nodeWidth)
      .attr('height', nOfAttributes * 30 + 30)
      .style('fill', 'none')
      .attr('id', 'shapeGroupRect');

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

    let yOffset = 80;

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

      yOffset += 30;

      const coordinate = {
        [entity.eTitle]: key,
        x: (firstColTxtPivot + secondColTxtPivot) / 2 + index * 200,
        y: yOffset,
      };
      entitiesCoordinates.push(coordinate);
      shapeGroup.call(
        d3
          .drag<any, unknown>()
          .subject(function (event) {
            const groupElement: SVGGElement = this;
            const transform = groupElement.transform.baseVal.consolidate();
            return { x: transform ? transform.matrix.e : 0, y: transform ? transform.matrix.f : 0 };
          })
          .on('start', function (e) {
            console.log('start',e);
          })
          .on('drag', function (event) {
            const groupElement: any = d3.select(this);
            const newX = event.x;
            const newY = event.y;

            groupElement.attr('x', newX).attr('y', newY);
            groupElement.attr('transform', `translate(${newX}, ${newY})`);
          })
      );
    });
    return shapeGroup;
  });
  drawNodeLines(svg, entitiesCoordinates, shapesGroupArray)
  return { shapesGroupArray, entitiesCoordinates };
}

export function drawNodeLines(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  entitiesCoordinates: any,
  shapesGroupArray: any
): any {
  console.log('entitiesAttrCoordinates', entitiesCoordinates);
  const startX = 150 + 30; // X coordinate of start point (right side of first entity)
  const startY = entitiesCoordinates[0].y; // Y coordinate of start point (middle of first entity)
  const endX = entitiesCoordinates[5].x; // X coordinate of end point (left side of second entity)
  const endY = entitiesCoordinates[5].y; // Y coordinate of end point (top of second entity)

  const lineData = [
    { date: startX, value: startY }, // Start point
    { date: endX, value: endY }, // End point
  ];

  const line = d3
    .line<any>()
    .x((d) => d.date)
    .y((d) => d.value)
    .curve(d3.curveNatural);

  svg
    .append('path')
    .attr('d', line(lineData))
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
    .attr('fill', 'none');
}
