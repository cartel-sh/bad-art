import { useRef, useCallback } from 'react';
import Konva from 'konva';
import {
  getPointerPosition,
  performFloodFill,
  colorsMatch,
  hexToRgba,
} from '@/lib/drawing';
import { UserLayerData, ToolbarTool } from '@/lib/types';
import { UpdateHistoryOptions } from '@/app/draw/[id]/page';

interface UseDrawingInteractionsProps {
  tool: ToolbarTool;
  layers: UserLayerData[];
  setLayers: (updater: (prevLayers: UserLayerData[]) => UserLayerData[], options?: UpdateHistoryOptions) => void;
  activeLayerId: string | null;
  fillColor: string;
  strokeColor: string;
  tolerance: number;
  strokeWidth: number;
  stageRef: React.RefObject<Konva.Stage | null>;
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
}: UseDrawingInteractionsProps) => {
  const isDrawing = useRef(false);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const prevPosRef = useRef<{ x: number; y: number } | null>(null);
  const initialLayerDataOnDrawStart = useRef<string | null>(null);

  const handleInteractionStart = useCallback(async (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    const pos = getPointerPosition(stage);

    if (!pos || !activeLayerId) return;

    const currentActiveLayer = layers.find(l => l.id === activeLayerId);
    if (!currentActiveLayer) return;

    initialLayerDataOnDrawStart.current = currentActiveLayer.rasterDataUrl;

    if ((e.evt instanceof MouseEvent && e.evt.button === 0) || !(e.evt instanceof MouseEvent)) {
      e.evt.preventDefault();
      e.cancelBubble = true;

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = stage?.width() || 500;
      offscreenCanvas.height = stage?.height() || 500;
      const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      offscreenCtxRef.current = ctx;

      if (tool === 'bucket') {
        if (!currentActiveLayer.rasterDataUrl) {
          console.warn("Active layer raster data is not available for flood fill.");
          return;
        }
        const dataURL = currentActiveLayer.rasterDataUrl;
        const imgToProcess = new window.Image();
        imgToProcess.onload = async () => {
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
          offscreenCtxRef.current = null;
        };
        imgToProcess.onerror = () => {
          console.error("Failed to load image for flood fill from layer rasterDataUrl");
          offscreenCtxRef.current = null;
        }
        imgToProcess.src = dataURL;

      } else if (tool === 'pen' || tool === 'eraser') {
        isDrawing.current = true;
        prevPosRef.current = pos;

        const img = new window.Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

          ctx.beginPath();
          ctx.arc(pos.x, pos.y, strokeWidth / 2, 0, Math.PI * 2);
          ctx.fillStyle = tool === 'pen' ? strokeColor : 'transparent';
          if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
          } else {
            ctx.globalCompositeOperation = 'source-over';
          }
          ctx.fill();
          ctx.globalCompositeOperation = 'source-over';

          const newDataUrl = offscreenCanvas.toDataURL();
          setLayers(prevLayers =>
            prevLayers.map(l =>
              l.id === activeLayerId ? { ...l, rasterDataUrl: newDataUrl } : l
            ),
            { skipHistory: true }
          );
        };
        img.onerror = () => console.error("Failed to load image for drawing from layer rasterDataUrl");
        img.src = currentActiveLayer.rasterDataUrl || '';
      }
    }
  }, [stageRef, layers, activeLayerId, tool, strokeColor, fillColor, tolerance, strokeWidth, setLayers]);

  const handleInteractionMove = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing.current || !activeLayerId || (tool !== 'pen' && tool !== 'eraser')) return;

    const stage = stageRef.current;
    const pos = getPointerPosition(stage);
    const ctx = offscreenCtxRef.current;

    if (!pos || !ctx || !prevPosRef.current) return;

    ctx.beginPath();
    ctx.moveTo(prevPosRef.current.x, prevPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.strokeStyle = strokeColor;
      ctx.globalCompositeOperation = 'source-over';
    } else if (tool === 'eraser') {
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.globalCompositeOperation = 'destination-out';
    }
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    prevPosRef.current = pos;

    const newDataUrl = ctx.canvas.toDataURL();
    setLayers(prevLayers =>
      prevLayers.map(l =>
        l.id === activeLayerId ? { ...l, rasterDataUrl: newDataUrl } : l
      ),
      { skipHistory: true }
    );
  }, [activeLayerId, tool, strokeColor, strokeWidth, setLayers, stageRef]);

  const handleInteractionEnd = useCallback(() => {
    if ((tool === 'pen' || tool === 'eraser') && isDrawing.current) {
      const ctx = offscreenCtxRef.current;
      if (ctx) {
        const finalDataUrl = ctx.canvas.toDataURL();
        const currentLayerState = layers.find(l => l.id === activeLayerId);
        if (currentLayerState && finalDataUrl !== initialLayerDataOnDrawStart.current) {
          setLayers(prevLayers =>
            prevLayers.map(l =>
              l.id === activeLayerId ? { ...l, rasterDataUrl: finalDataUrl } : l
            )
          );
        }
      }
    }
    isDrawing.current = false;
    prevPosRef.current = null;
    offscreenCtxRef.current = null;
    initialLayerDataOnDrawStart.current = null;
  }, [tool, setLayers, activeLayerId, layers]);

  return { handleInteractionStart, handleInteractionMove, handleInteractionEnd, isDrawingRef: isDrawing };
}; 