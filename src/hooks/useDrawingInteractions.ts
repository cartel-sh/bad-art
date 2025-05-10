import { useRef, useCallback } from 'react';
import Konva from 'konva';
import {
  getPointerPosition,
  startPath,
  addPointToPath,
  performFloodFill,
  colorsMatch,
  hexToRgba,
} from '@/lib/drawing';
import { UserLayerData, VectorShapeData, ToolbarTool } from '@/lib/types'; // Import from types.ts

interface UseDrawingInteractionsProps {
  tool: ToolbarTool; // This should be ToolbarTool from types.ts
  layers: UserLayerData[];
  setLayers: React.Dispatch<React.SetStateAction<UserLayerData[]>>;
  activeLayerId: string | null;
  fillColor: string;
  strokeColor: string;
  tolerance: number;
  strokeWidth: number; // Added strokeWidth
  stageRef: React.RefObject<Konva.Stage | null>; // Allow stageRef.current to be null initially
  // layerImageElements: { [key: string]: HTMLImageElement }; // Needed for flood fill source image
}

export const useDrawingInteractions = ({
  tool,
  layers,
  setLayers,
  activeLayerId,
  fillColor,
  strokeColor,
  tolerance,
  strokeWidth,
  stageRef,
  // layerImageElements,
}: UseDrawingInteractionsProps) => {
  const isDrawing = useRef(false);

  const handleInteractionStart = useCallback(async (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    const pos = getPointerPosition(stage);

    if (!pos || !activeLayerId) return;

    const currentActiveLayer = layers.find(l => l.id === activeLayerId);
    if (!currentActiveLayer) return;

    if ((e.evt instanceof MouseEvent && e.evt.button === 0) || !(e.evt instanceof MouseEvent)) {
      e.evt.preventDefault();
      e.cancelBubble = true;

      if (tool === 'bucket') {
        if (!currentActiveLayer.rasterDataUrl) {
          console.warn("Active layer raster data is not available for flood fill.");
          return;
        }
        const dataURL = currentActiveLayer.rasterDataUrl;
        const imgToProcess = new window.Image();
        imgToProcess.onload = async () => {
          const offscreenCanvas = document.createElement('canvas');
          offscreenCanvas.width = stage?.width() || 500;
          offscreenCanvas.height = stage?.height() || 500;
          const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;

          ctx.drawImage(imgToProcess, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
          const pixelData = ctx.getImageData(Math.floor(pos.x), Math.floor(pos.y), 1, 1).data;
          const targetRgba = { r: pixelData[0], g: pixelData[1], b: pixelData[2], a: pixelData[3] };
          const currentFillRgba = hexToRgba(fillColor, 255);

          if (colorsMatch(targetRgba.r, targetRgba.g, targetRgba.b, targetRgba.a, currentFillRgba.r, currentFillRgba.g, currentFillRgba.b, currentFillRgba.a, tolerance)) {
            return;
          }

          const fullImageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
          const filledImageData = performFloodFill({
            imageData: fullImageData,
            startX: Math.floor(pos.x),
            startY: Math.floor(pos.y),
            targetColor: targetRgba,
            fillColor: currentFillRgba,
            tolerance: tolerance,
          });

          if (filledImageData) {
            ctx.putImageData(filledImageData, 0, 0);
            const newFilledDataUrl = offscreenCanvas.toDataURL();
            setLayers(prevLayers =>
              prevLayers.map(l =>
                l.id === activeLayerId ? { ...l, rasterDataUrl: newFilledDataUrl } : l
              )
            );
          }
        };
        imgToProcess.onerror = () => console.error("Failed to load image for flood fill from layer rasterDataUrl");
        imgToProcess.src = dataURL;
      } else if (tool === 'pen' || tool === 'eraser') {
        isDrawing.current = true;
        const updatedLayers = startPath(layers, activeLayerId, pos, tool, strokeColor, strokeWidth);
        setLayers(updatedLayers);
      }
    }
  }, [stageRef, layers, activeLayerId, tool, strokeColor, fillColor, tolerance, strokeWidth, setLayers]);

  const handleInteractionMove = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing.current || tool === 'bucket' || !activeLayerId) return;

    const stage = stageRef.current;
    const pos = getPointerPosition(stage);
    if (!pos) return;

    const updatedLayers = addPointToPath(layers, activeLayerId, pos);
    setLayers(updatedLayers);
  }, [layers, activeLayerId, tool, setLayers, stageRef]);

  const handleInteractionEnd = useCallback(() => {
    if (tool !== 'bucket') {
      isDrawing.current = false;
    }
  }, [tool]);

  return { handleInteractionStart, handleInteractionMove, handleInteractionEnd, isDrawingRef: isDrawing };
}; 