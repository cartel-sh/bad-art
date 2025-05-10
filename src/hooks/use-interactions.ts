import { useRef, useCallback } from 'react';
import Konva from 'konva';
import { v4 as uuidv4 } from 'uuid';
import Color from 'color';
import {
  getPointerPosition,
  colorsMatch,
  performFloodFill,
} from '@/lib/drawing';
import { UserLayerData, ToolbarTool, VectorShapeData } from '@/lib/types';
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
  const initialLayerDataOnDrawStart = useRef<string | null>(null);
  const currentKonvaLineRef = useRef<Konva.Line | null>(null);

  const handleInteractionStart = useCallback(async (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    const pos = getPointerPosition(stage);

    if (!pos || !activeLayerId || !stage) return;

    const currentActiveUserData = layers.find(l => l.id === activeLayerId);
    if (!currentActiveUserData) return;

    const actualPixelRatio = (stage.attrs && stage.attrs.pixelRatio) ? stage.attrs.pixelRatio : (typeof window !== 'undefined' ? window.devicePixelRatio : 1);

    if (tool === 'bucket') {
      initialLayerDataOnDrawStart.current = currentActiveUserData.rasterDataUrl;
    }

    if ((e.evt instanceof MouseEvent && e.evt.button === 0) || !(e.evt instanceof MouseEvent)) {
      e.evt.preventDefault();
      e.cancelBubble = true;

      if (tool === 'pen' || tool === 'eraser') {
        isDrawing.current = true;

        const targetLayer = stage.findOne<Konva.Layer>('#' + activeLayerId);
        if (!targetLayer) {
          console.error(`Drawing layer with ID '#${activeLayerId}' not found on stage.`);
          isDrawing.current = false;
          return;
        }

        const lineId = uuidv4();
        const konvaLine = new Konva.Line({
          id: lineId,
          points: [pos.x, pos.y, pos.x, pos.y],
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          lineCap: 'round',
          lineJoin: 'round',
          tension: 0.1,
          globalCompositeOperation: tool === 'pen' ? 'source-over' : 'destination-out',
          perfectDrawEnabled: false,
          listening: false,
        });

        targetLayer.add(konvaLine);
        currentKonvaLineRef.current = konvaLine;
        targetLayer.batchDraw();

      } else if (tool === 'bucket') {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = stage.width() * actualPixelRatio;
        offscreenCanvas.height = stage.height() * actualPixelRatio;

        const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        offscreenCtxRef.current = ctx;

        const loadExistingRasterPromise = new Promise<void>((resolve) => {
          if (currentActiveUserData.rasterDataUrl) {
            const imgToProcess = new window.Image();
            imgToProcess.onload = (ev: Event) => {
              ctx.drawImage(imgToProcess, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
              resolve();
            };
            imgToProcess.onerror = (ev: Event | string) => {
              console.warn("Failed to load existing raster image for flood fill. Starting with a clear base.");
              ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
              resolve();
            };
            imgToProcess.src = currentActiveUserData.rasterDataUrl;
          } else {
            ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
            resolve();
          }
        });

        loadExistingRasterPromise.then(async () => {
          await renderVectorShapesToContext(ctx, currentActiveUserData.vectorShapes, {
            width: offscreenCanvas.width,
            height: offscreenCanvas.height,
            pixelRatio: actualPixelRatio
          });
          const scaledPos = { x: pos.x * actualPixelRatio, y: pos.y * actualPixelRatio };
          proceedWithFloodFill(ctx, scaledPos, currentActiveUserData, offscreenCanvas.width, offscreenCanvas.height);
        });
      }
    }
  }, [stageRef, layers, activeLayerId, tool, strokeColor, fillColor, tolerance, strokeWidth, setLayers]);

  const proceedWithFloodFill = (ctx: CanvasRenderingContext2D, pos: { x: number, y: number }, userData: UserLayerData, canvasWidth: number, canvasHeight: number) => {
    const pixelData = ctx.getImageData(Math.floor(pos.x), Math.floor(pos.y), 1, 1).data;
    const targetRgba = { r: pixelData[0], g: pixelData[1], b: pixelData[2], a: pixelData[3] };

    const colorService = Color(fillColor);
    const currentFillRgba = {
      r: colorService.red(),
      g: colorService.green(),
      b: colorService.blue(),
      a: Math.round(colorService.alpha() * 255)
    };

    if (colorsMatch(targetRgba.r, targetRgba.g, targetRgba.b, targetRgba.a, currentFillRgba.r, currentFillRgba.g, currentFillRgba.b, currentFillRgba.a, tolerance)) {
      offscreenCtxRef.current = null;
      return;
    }

    const fullImageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
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
      const newFilledDataUrl = ctx.canvas.toDataURL();
      setLayers(prevLayers =>
        prevLayers.map(l =>
          l.id === activeLayerId ? { ...l, rasterDataUrl: newFilledDataUrl } : l
        )
      );
    }
    offscreenCtxRef.current = null;
  };

  const handleInteractionMove = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing.current || !activeLayerId || (tool !== 'pen' && tool !== 'eraser')) return;

    const stage = stageRef.current;
    const pos = getPointerPosition(stage);
    const line = currentKonvaLineRef.current;

    if (!pos || !line || !stage) return;

    e.evt.preventDefault();
    e.cancelBubble = true;

    const newPoints = line.points().concat([pos.x, pos.y]);
    line.points(newPoints);

    const layer = line.getLayer();
    if (layer) {
      layer.batchDraw();
    } else {
      stage.batchDraw(); // Fallback if layer somehow not found, though unlikely
    }

  }, [activeLayerId, tool, stageRef]);

  const handleInteractionEnd = useCallback(async () => {
    if ((tool === 'pen' || tool === 'eraser') && isDrawing.current && currentKonvaLineRef.current && activeLayerId) {
      const liveLine = currentKonvaLineRef.current;

      const newShapeData: VectorShapeData = {
        id: liveLine.id(), // Ensure Konva.Line had an ID set during creation
        tool: tool, // 'pen' or 'eraser'
        points: liveLine.points(),
        stroke: liveLine.stroke() as string,
        strokeWidth: liveLine.strokeWidth(),
        globalCompositeOperation: liveLine.globalCompositeOperation() as GlobalCompositeOperation,
        tension: liveLine.tension(),
      };

      setLayers(prevLayers =>
        prevLayers.map(l =>
          l.id === activeLayerId
            ? { ...l, vectorShapes: [...l.vectorShapes, newShapeData] }
            : l
        )
      );
      // The Konva.Line (liveLine) remains on its layer. 
      // It will be re-created from VectorShapeData when layers are rendered or loaded.
      // Or, if your main component directly manipulates Konva objects based on UserLayerData changes,
      // this liveLine is already the representation of newShapeData.

      // Destroy the imperatively added line, as it will be re-rendered declaratively
      if (liveLine) {
        liveLine.destroy();
      }
    }
    // Bucket tool finalization (setting rasterDataUrl) happens in proceedWithFloodFill
    // So, only common cleanup is needed here for bucket tool after its async operations complete

    // Common cleanup for all tools after interaction ends
    isDrawing.current = false;
    currentKonvaLineRef.current = null;
    // initialLayerDataOnDrawStart.current is mainly for bucket tool's base raster image, or complex undo later
    // If bucket tool used it, it should be nulled out after its operation in proceedWithFloodFill or here.
    // For now, let's ensure it's cleared for all if its primary use was for the interaction that just ended.
    initialLayerDataOnDrawStart.current = null;

  }, [tool, setLayers, activeLayerId, layers]); // Added layers to dependency array for map

  return { handleInteractionStart, handleInteractionMove, handleInteractionEnd, isDrawingRef: isDrawing };
};

// Add the new helper function renderVectorShapesToContext
async function renderVectorShapesToContext(
  ctx: CanvasRenderingContext2D,
  shapes: VectorShapeData[],
  canvasRenderConfig: { width: number, height: number, pixelRatio: number }
): Promise<void> {
  if (!shapes || shapes.length === 0) {
    return;
  }

  const tempStage = new Konva.Stage({
    container: document.createElement('div'),
    width: canvasRenderConfig.width / canvasRenderConfig.pixelRatio,
    height: canvasRenderConfig.height / canvasRenderConfig.pixelRatio,
    pixelRatio: canvasRenderConfig.pixelRatio,
  });
  const tempLayer = new Konva.Layer();
  tempStage.add(tempLayer);

  shapes.forEach(shapeData => {
    if (shapeData.tool === 'pen' || shapeData.tool === 'eraser') {
      const line = new Konva.Line({
        points: shapeData.points,
        stroke: shapeData.stroke,
        strokeWidth: shapeData.strokeWidth,
        lineCap: 'round',
        lineJoin: 'round',
        tension: shapeData.tension || 0, // Default tension if not set
        globalCompositeOperation: shapeData.globalCompositeOperation,
        perfectDrawEnabled: false,
        listening: false,
      });
      tempLayer.add(line);
    }
    // Extend here for other vector shape types if any
  });

  tempLayer.draw(); // Draw the shapes on the temporary layer

  // Now draw the content of this temporary Konva layer onto the provided context (ctx)
  const konvaCanvasElement = tempLayer.getCanvas()._canvas;
  if (konvaCanvasElement) {
    ctx.drawImage(konvaCanvasElement, 0, 0);
  }

  tempStage.destroy();
} 