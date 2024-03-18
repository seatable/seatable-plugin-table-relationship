import * as d3 from 'd3';
import { Rectangle } from './Interfaces/custom-interfaces/ERDPlugin';

export function generateNonOverlappingRectangles(
  count: number,
  width: number,
  height: number
): Rectangle[] {
  const rectangles: Rectangle[] = [];

  // Function to check if a rectangle overlaps with any existing rectangle
  function isOverlapping(rect: Rectangle): boolean {
    return rectangles.some(
      (r) =>
        rect.x < r.x + r.width &&
        rect.x + rect.width > r.x &&
        rect.y < r.y + r.height &&
        rect.y + rect.height > r.y
    );
  }

  for (let i = 0; i < count; i++) {
    let rect: Rectangle;
    do {
      // Generate random coordinates for the rectangle
      rect = {
        // x: Math.random() * width - 100,
        // y: Math.random() * height - 200,
        x: Math.random() * 500,
        y: Math.random() * 500,
        width: 70,
        height: 100,
      };
    } while (isOverlapping(rect)); // Repeat until the rectangle doesn't overlap

    rectangles.push(rect);
  }

  return rectangles;
}
