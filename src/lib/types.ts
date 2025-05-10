export type ToolbarTool = 'pen' | 'eraser' | 'bucket';

export interface VectorShapeData {
  id: string;
  tool: 'pen' | 'eraser';
  points: number[];
  stroke: string;
  strokeWidth: number;
  globalCompositeOperation: GlobalCompositeOperation;
  tension?: number;
}

export interface UserLayerData {
  id: string;
  name: string;
  isVisible: boolean;
  opacity: number;
  rasterDataUrl: string | null;
  vectorShapes: VectorShapeData[];
}
