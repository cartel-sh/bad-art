import Konva from "konva";

export function getPointerPosition(
  stage: Konva.Stage | null,
  gridSize?: number
): { x: number; y: number } | null {
  if (!stage) return null;
  const pointerPosition = stage.getPointerPosition();
  if (!pointerPosition) return null;
  
  if (gridSize && gridSize > 0) {
    const pixelSize = 500 / gridSize;
    const pixelX = Math.floor(pointerPosition.x / pixelSize);
    const pixelY = Math.floor(pointerPosition.y / pixelSize);
    return {
      x: pixelX * pixelSize + pixelSize / 2,
      y: pixelY * pixelSize + pixelSize / 2,
    };
  }
  
  return { x: Math.round(pointerPosition.x), y: Math.round(pointerPosition.y) };
}

export function getPixelPerfectLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  pixelSize: number
): number[] {
  // Convert to pixel coordinates
  const px0 = Math.floor(x0 / pixelSize);
  const py0 = Math.floor(y0 / pixelSize);
  const px1 = Math.floor(x1 / pixelSize);
  const py1 = Math.floor(y1 / pixelSize);
  
  const points: number[] = [];
  
  // Bresenham's line algorithm for pixel-perfect lines
  const dx = Math.abs(px1 - px0);
  const dy = Math.abs(py1 - py0);
  const sx = px0 < px1 ? 1 : -1;
  const sy = py0 < py1 ? 1 : -1;
  let err = dx - dy;
  
  let x = px0;
  let y = py0;
  
  while (true) {
    // Convert back to canvas coordinates (center of pixel)
    const canvasX = x * pixelSize + pixelSize / 2;
    const canvasY = y * pixelSize + pixelSize / 2;
    points.push(canvasX, canvasY);
    
    if (x === px1 && y === py1) break;
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  
  return points;
}

export function colorsMatch(
  r1: number,
  g1: number,
  b1: number,
  a1: number,
  r2: number,
  g2: number,
  b2: number,
  a2: number,
  tolerance: number,
): boolean {
  if (a1 < 5 && a2 < 5) return true;

  if ((a1 < 5 && a2 >= 5) || (a2 < 5 && a1 >= 5)) return false;

  const distanceSquared = (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;

  return distanceSquared <= tolerance ** 2;
}

export interface FloodFillParams {
  imageData: ImageData;
  startX: number;
  startY: number;
  targetColor: { r: number; g: number; b: number; a: number };
  fillColor: { r: number; g: number; b: number; a: number };
  tolerance: number;
}

export function performFloodFill({
  imageData,
  startX,
  startY,
  targetColor,
  fillColor,
  tolerance,
}: FloodFillParams): ImageData | null {
  const { width, height, data } = imageData;

  const getPixelR = (offset: number) => data[offset];
  const getPixelG = (offset: number) => data[offset + 1];
  const getPixelB = (offset: number) => data[offset + 2];
  const getPixelA = (offset: number) => data[offset + 3];

  const setPixel = (offset: number) => {
    data[offset] = fillColor.r;
    data[offset + 1] = fillColor.g;
    data[offset + 2] = fillColor.b;
    data[offset + 3] = fillColor.a;
  };

  const initialPixelOffset = (startY * width + startX) * 4;
  if (
    !colorsMatch(
      getPixelR(initialPixelOffset),
      getPixelG(initialPixelOffset),
      getPixelB(initialPixelOffset),
      getPixelA(initialPixelOffset),
      targetColor.r,
      targetColor.g,
      targetColor.b,
      targetColor.a,
      tolerance,
    )
  ) {
    return null; // Start point does not match target color
  }

  const queue: [number, number][] = [];
  const visited = new Uint8Array(width * height); // 0 for not visited, 1 for visited/queued
  let head = 0;

  queue.push([startX, startY]);
  visited[startY * width + startX] = 1;
  setPixel(initialPixelOffset);

  while (head < queue.length) {
    const [x, y] = queue[head++];

    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighborIndexInVisited = ny * width + nx;
        if (visited[neighborIndexInVisited] === 0) {
          const neighborOffset = (ny * width + nx) * 4;
          if (
            colorsMatch(
              getPixelR(neighborOffset),
              getPixelG(neighborOffset),
              getPixelB(neighborOffset),
              getPixelA(neighborOffset),
              targetColor.r,
              targetColor.g,
              targetColor.b,
              targetColor.a,
              tolerance,
            )
          ) {
            setPixel(neighborOffset);
            visited[neighborIndexInVisited] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }
  }
  return imageData;
}
