import React from "react";
import { Line } from "react-konva";

interface PixelGridProps {
  width: number;
  height: number;
  gridSize: number;
}

export function PixelGrid({ width, height, gridSize }: PixelGridProps) {
  const lines = [];
  const pixelSize = width / gridSize;

  // Vertical lines
  for (let i = 0; i <= gridSize; i++) {
    const x = i * pixelSize;
    lines.push(
      <Line
        key={`v-${i}`}
        points={[x, 0, x, height]}
        stroke="rgba(0, 0, 0, 0.1)"
        strokeWidth={1}
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  }

  // Horizontal lines
  for (let i = 0; i <= gridSize; i++) {
    const y = i * pixelSize;
    lines.push(
      <Line
        key={`h-${i}`}
        points={[0, y, width, y]}
        stroke="rgba(0, 0, 0, 0.1)"
        strokeWidth={1}
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  }

  return <>{lines}</>;
}