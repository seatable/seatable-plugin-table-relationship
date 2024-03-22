import * as d3 from 'd3';

export function createNodeWithDrag(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  entities: any[]
): d3.Selection<SVGGElement, unknown, null, undefined>[] {
  const shapesGroupArray = entities.map((entity, index) => {
    const shapeGroup = svg.append('g');
    const nOfAttributes = Object.keys(entity.eAttributes).length;

    shapeGroup
      .append('rect')
      .attr('x', 30 + (index % 2) * 200)
      .attr('y', 30)
      .attr('width', 150)
      .attr('height', nOfAttributes * 30 + 30)
      .style('fill', 'none')
      .style('stroke', 'black')
      .style('stroke-width', '1px')
      .attr('id', 'shapeGroupRect');

    shapeGroup
      .append('rect')
      .attr('x', 30 + (index % 2) * 200)
      .attr('y', 30)
      .attr('width', 150)
      .attr('height', 30)
      .style('stroke', 'black')
      .style('stroke-width', '1px')
      .style('fill', 'lightblue');

    shapeGroup
      .append('text')
      .attr('x', 60 + (index % 2) * 200)
      .attr('y', 48)
      .text(entity.eTitle)
      .style('fill', 'black');

    shapeGroup
      .append('rect')
      .attr('x', 30 + (index % 2) * 200)
      .attr('y', 60)
      .attr('width', 150)
      .attr('height', nOfAttributes * 30)
      .style('fill', 'lightgray');

    let yOffset = 80;
    Object.entries(entity.eAttributes).forEach(([key, value]) => {
      shapeGroup
        .append('text')
        .attr('x', 45 + (index % 2) * 200)
        .attr('y', yOffset)
        .text(`${key}:`)
        .style('fill', 'black');

      shapeGroup
        .append('text')
        .attr('x', 125 + (index % 2) * 200)
        .attr('y', yOffset)
        .text(String(value))
        .style('fill', 'black');

      yOffset += 30;

      shapeGroup.call(
        d3
          .drag<any, unknown>()
          .subject(function (event) {
            const groupElement: SVGGElement = this;
            const transform = groupElement.transform.baseVal.consolidate();
            return { x: transform ? transform.matrix.e : 0, y: transform ? transform.matrix.f : 0 };
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

  return shapesGroupArray;
}
