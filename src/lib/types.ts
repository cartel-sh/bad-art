import Konva from 'konva';

// Defines the tools available in the toolbar and for drawing logic
export type ToolbarTool = 'pen' | 'eraser' | 'bucket';

// Represents a single vector shape (like a line or an eraser path)
// export interface VectorShapeData {
//   id: string;
//   type: ToolbarTool; // 'pen' or 'eraser' specifically for vector shapes
//   points?: number[];
//   stroke?: string;
//   strokeWidth?: number;
//   fill?: string; // Used by 'pen' for its own color
// }

// Represents a single user layer in the drawing application
export interface UserLayerData {
  id: string;
  name: string;
  isVisible: boolean;
  opacity: number;
  rasterDataUrl: string | null; // Data URL for the layer's raster/pixel content
  // vectorShapes: VectorShapeData[]; // Vector shapes drawn on this layer
}

// Generic type for Konva event objects if needed more broadly
// export type KonvaEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>; 