// Helper function to compare colors with tolerance
export const colorsMatch = (r1: number, g1: number, b1: number, a1: number,
  r2: number, g2: number, b2: number, a2: number,
  tolerance: number): boolean => {
  const diffR = Math.abs(r1 - r2);
  const diffG = Math.abs(g1 - g2);
  const diffB = Math.abs(b1 - b2);
  const diffA = Math.abs(a1 - a2); // Alpha can also be part of tolerance if desired
  // Simple sum of differences. Max diff per channel is 255. Max total diff 255*4.
  // Adjust tolerance scale accordingly if using a different metric.
  return (diffR + diffG + diffB + diffA) <= tolerance * 4; // Tolerance is 0-255, scale it
};

// Placeholder for the actual flood fill algorithm
// This will take imageData, startX, startY, targetColor, fillColor, tolerance
// And return new imageData or a structure to create a Konva.Image
export const performFloodFill = (args: {
  imageData: ImageData;
  startX: number;
  startY: number;
  targetColor: { r: number; g: number; b: number; a: number };
  fillColor: { r: number; g: number; b: number; a: number };
  tolerance: number;
}): ImageData | null => {
  const { imageData, startX, startY, targetColor, fillColor: newFillColor, tolerance } = args;
  const { width, height, data } = imageData;
  const q: [number, number][] = [];
  const visited = new Uint8Array(width * height).fill(0);

  const getPixelIndex = (x: number, y: number) => (y * width + x) * 4;

  const startIdx = getPixelIndex(startX, startY);
  const initialR = data[startIdx];
  const initialG = data[startIdx + 1];
  const initialB = data[startIdx + 2];
  const initialA = data[startIdx + 3];

  // If the start pixel is already the fill color (within tolerance), do nothing (or handle as needed)
  if (colorsMatch(initialR, initialG, initialB, initialA, newFillColor.r, newFillColor.g, newFillColor.b, newFillColor.a, tolerance)) {
    return null;
  }

  q.push([startX, startY]);
  visited[startY * width + startX] = 1;

  const filledPixelData = new Uint8ClampedArray(data); // Create a copy to modify

  while (q.length > 0) {
    const [x, y] = q.shift()!;
    const currentIdx = getPixelIndex(x, y);

    // Check if current pixel color matches targetColor within tolerance
    if (colorsMatch(data[currentIdx], data[currentIdx + 1], data[currentIdx + 2], data[currentIdx + 3],
      initialR, initialG, initialB, initialA, tolerance)) {

      // Change color of the current pixel in the copy
      filledPixelData[currentIdx] = newFillColor.r;
      filledPixelData[currentIdx + 1] = newFillColor.g;
      filledPixelData[currentIdx + 2] = newFillColor.b;
      filledPixelData[currentIdx + 3] = newFillColor.a; // Usually 255 for opaque fill

      // Add neighbors to queue (4-way)
      const neighbors: [number, number][] = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny * width + nx]) {
          visited[ny * width + nx] = 1;
          q.push([nx, ny]);
        }
      }
    }
  }
  return new ImageData(filledPixelData, width, height);
};

export const hexToRgba = (hex: string, alpha: number = 255) => {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b, a: alpha };
};

export const getPointerPosition = (stage: import('konva').default.Stage | null) => {
  if (!stage) return null;
  return stage.getPointerPosition();
};
