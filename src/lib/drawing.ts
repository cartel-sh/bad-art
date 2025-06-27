import Konva from "konva";

export function getPointerPosition(stage: Konva.Stage | null): { x: number; y: number } | null {
  if (!stage) return null;
  const pointerPosition = stage.getPointerPosition();
  if (!pointerPosition) return null;
  return { x: Math.round(pointerPosition.x), y: Math.round(pointerPosition.y) };
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
