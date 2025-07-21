export type ToolbarTool = "pen" | "eraser" | "bucket";

export type CanvasType = "regular" | "pixel";

export interface VectorShapeData {
  id: string;
  tool: "pen" | "eraser";
  type?: "line" | "pixels";
  points?: number[];
  pixels?: { x: number; y: number; width: number; height: number }[];
  stroke: string;
  strokeWidth: number;
  globalCompositeOperation: GlobalCompositeOperation;
  tension?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
}

export interface UserLayerData {
  id: string;
  name: string;
  isVisible: boolean;
  opacity: number;
  rasterDataUrl: string | null;
  vectorShapes: VectorShapeData[];
}

export interface DrawingMetadata {
  canvasType: CanvasType;
  gridSize?: number;
}

export interface DrawingData {
  layers: UserLayerData[];
  metadata?: DrawingMetadata;
  derivedFromPostId?: string;
}
