import { UpdateHistoryOptions } from "@/app/draw/[id]/page";
import { colorsMatch, getPointerPosition, performFloodFill, getPixelPerfectLine } from "@/lib/drawing";
import { ToolbarTool, UserLayerData, VectorShapeData, CanvasType } from "@/lib/types";
import Color from "color";
import Konva from "konva";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

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
  gridSize?: number;
  canvasType: CanvasType;
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
  gridSize,
  canvasType,
}: UseDrawingInteractionsProps) => {
  const isDrawing = useRef(false);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const initialLayerDataOnDrawStart = useRef<string | null>(null);
  const currentKonvaLineRef = useRef<Konva.Line | null>(null);

  const handleGlobalPointerMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const stage = stageRef.current;
      if (!isDrawing.current || !activeLayerId || (tool !== "pen" && tool !== "eraser") || !stage) {
        return;
      }

      // Prevent default only if touch event to avoid scrolling, etc.
      // Mouse move default is usually fine.
      if (event.type === "touchmove") {
        event.preventDefault();
      }

      stage.setPointersPositions(event); // Update Konva's internal pointer positions
      const pos = getPointerPosition(stage, gridSize);
      const element = currentKonvaLineRef.current;

      if (!pos || !element) return;

      if (canvasType === "pixel" && gridSize && element instanceof Konva.Group) {
        // For pixel art, add individual pixels
        const pixelGroup = element;
        const pixelSize = 500 / gridSize;
        const pixelX = Math.floor(pos.x / pixelSize) * pixelSize;
        const pixelY = Math.floor(pos.y / pixelSize) * pixelSize;
        
        // Check if we already have a pixel at this position
        const children = pixelGroup.getChildren();
        const exists = children.some(child => {
          const rect = child as Konva.Rect;
          return rect.x() === pixelX && rect.y() === pixelY;
        });
        
        if (!exists) {
          // Add new pixel
          const firstChild = pixelGroup.getChildren()[0] as Konva.Rect;
          const pixel = new Konva.Rect({
            x: pixelX,
            y: pixelY,
            width: pixelSize,
            height: pixelSize,
            fill: firstChild.fill(),
            listening: false,
            perfectDrawEnabled: false,
            globalCompositeOperation: firstChild.globalCompositeOperation(),
          });
          
          pixelGroup.add(pixel);
        }
      } else if (element instanceof Konva.Line) {
        // Regular line drawing
        const line = element;
        const newPoints = line.points().concat([pos.x, pos.y]);
        line.points(newPoints);
      }

      const layer = element.getLayer();
      if (layer) {
        layer.batchDraw();
      } else {
        stage.batchDraw();
      }
    },
    [stageRef, activeLayerId, tool, gridSize, canvasType],
  );

  // Define handleInteractionEnd first as handleGlobalPointerUp depends on it.
  const handleInteractionEnd = useCallback(async () => {
    // Remove global listeners first, regardless of tool, to ensure cleanup
    // Note: handleGlobalPointerMove and handleGlobalPointerUp are stable due to their own useCallback.
    // So they don't strictly need to be in this dependency array if this function doesn't change when they do.
    // However, including them if this function's identity *should* change when they do is correct.
    // For listener removal, their current references are needed, obtained from the outer scope.
    window.removeEventListener("mousemove", handleGlobalPointerMove);
    window.removeEventListener("touchmove", handleGlobalPointerMove);
    window.removeEventListener("mouseup", handleGlobalPointerUp); // This will refer to the handleGlobalPointerUp defined below
    window.removeEventListener("touchend", handleGlobalPointerUp); // This will refer to the handleGlobalPointerUp defined below

    if ((tool === "pen" || tool === "eraser") && isDrawing.current && currentKonvaLineRef.current && activeLayerId) {
      const element = currentKonvaLineRef.current;
      
      if (canvasType === "pixel" && element instanceof Konva.Group) {
        // Save pixel group
        const pixelData: { x: number; y: number; width: number; height: number }[] = [];
        const children = element.getChildren();
        
        children.forEach(child => {
          const rect = child as Konva.Rect;
          pixelData.push({
            x: rect.x(),
            y: rect.y(),
            width: rect.width(),
            height: rect.height(),
          });
        });
        
        if (pixelData.length > 0) {
          const firstPixel = children[0] as Konva.Rect;
          const newShapeData: VectorShapeData = {
            id: element.id(),
            tool: tool,
            type: "pixels",
            pixels: pixelData,
            stroke: firstPixel.fill() as string,
            strokeWidth: firstPixel.width(),
            globalCompositeOperation: firstPixel.globalCompositeOperation() as GlobalCompositeOperation,
          };
          
          setLayers((prevLayers) =>
            prevLayers.map((l) => (l.id === activeLayerId ? { ...l, vectorShapes: [...l.vectorShapes, newShapeData] } : l)),
          );
        }
      } else if (element instanceof Konva.Line) {
        // Save regular line
        const newShapeData: VectorShapeData = {
          id: element.id(),
          tool: tool,
          type: "line",
          points: element.points(),
          stroke: element.stroke() as string,
          strokeWidth: element.strokeWidth(),
          globalCompositeOperation: element.globalCompositeOperation() as GlobalCompositeOperation,
          tension: element.tension(),
          lineCap: element.lineCap() as CanvasLineCap,
          lineJoin: element.lineJoin() as CanvasLineJoin,
        };
        
        setLayers((prevLayers) =>
          prevLayers.map((l) => (l.id === activeLayerId ? { ...l, vectorShapes: [...l.vectorShapes, newShapeData] } : l)),
        );
      }

      if (element) {
        element.destroy();
      }
    }

    isDrawing.current = false;
    currentKonvaLineRef.current = null;
    initialLayerDataOnDrawStart.current = null;
  }, [tool, setLayers, activeLayerId, layers, stageRef, strokeColor, strokeWidth]);

  const handleGlobalPointerUp = useCallback(() => {
    if (isDrawing.current) {
      handleInteractionEnd();
    }
  }, [handleInteractionEnd]);

  const handleInteractionStart = useCallback(
    async (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = stageRef.current;
      const pos = getPointerPosition(stage, gridSize);

      if (!pos || !activeLayerId || !stage) return;

      const currentActiveUserData = layers.find((l) => l.id === activeLayerId);
      if (!currentActiveUserData) return;

      const actualPixelRatio =
        stage.attrs && stage.attrs.pixelRatio
          ? stage.attrs.pixelRatio
          : typeof window !== "undefined"
            ? window.devicePixelRatio
            : 1;

      if (tool === "bucket") {
        initialLayerDataOnDrawStart.current = currentActiveUserData.rasterDataUrl;
      }

      if ((e.evt instanceof MouseEvent && e.evt.button === 0) || !(e.evt instanceof MouseEvent)) {
        e.evt.preventDefault();
        e.cancelBubble = true;

        if (tool === "pen" || tool === "eraser") {
          isDrawing.current = true;

          const targetLayer = stage.findOne<Konva.Layer>("#" + activeLayerId);
          if (!targetLayer) {
            toast.error("Layer is hidden", { duration: 500, position: "top-center" });
            isDrawing.current = false;
            return;
          }

          const lineId = uuidv4();
          const isPixelMode = canvasType === "pixel";
          
          if (isPixelMode && gridSize) {
            // For pixel art, create a group to hold individual pixel rectangles
            const pixelGroup = new Konva.Group({
              id: lineId,
              listening: false,
            });
            
            const pixelSize = 500 / gridSize;
            const pixelX = Math.floor(pos.x / pixelSize) * pixelSize;
            const pixelY = Math.floor(pos.y / pixelSize) * pixelSize;
            
            // Add first pixel
            const pixel = new Konva.Rect({
              x: pixelX,
              y: pixelY,
              width: pixelSize,
              height: pixelSize,
              fill: strokeColor,
              listening: false,
              perfectDrawEnabled: false,
              globalCompositeOperation: tool === "pen" ? "source-over" : "destination-out",
            });
            
            pixelGroup.add(pixel);
            targetLayer.add(pixelGroup);
            currentKonvaLineRef.current = pixelGroup as any; // Store group reference
          } else {
            // Regular drawing mode
            const konvaLine = new Konva.Line({
              id: lineId,
              points: [pos.x, pos.y, pos.x, pos.y],
              stroke: strokeColor,
              strokeWidth: strokeWidth,
              lineCap: "round",
              lineJoin: "round",
              tension: 0.1,
              globalCompositeOperation: tool === "pen" ? "source-over" : "destination-out",
              perfectDrawEnabled: false,
              listening: false,
            });
            
            targetLayer.add(konvaLine);
            currentKonvaLineRef.current = konvaLine;
          }
          
          targetLayer.batchDraw();

          // Add window event listeners for pen/eraser
          window.addEventListener("mousemove", handleGlobalPointerMove);
          window.addEventListener("touchmove", handleGlobalPointerMove, { passive: false }); // passive: false to allow preventDefault
          window.addEventListener("mouseup", handleGlobalPointerUp);
          window.addEventListener("touchend", handleGlobalPointerUp);
        } else if (tool === "bucket") {
          const offscreenCanvas = document.createElement("canvas");
          offscreenCanvas.width = stage.width() * actualPixelRatio;
          offscreenCanvas.height = stage.height() * actualPixelRatio;

          const ctx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
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
              pixelRatio: actualPixelRatio,
            });
            const scaledPos = { x: pos.x * actualPixelRatio, y: pos.y * actualPixelRatio };
            proceedWithFloodFill(ctx, scaledPos, currentActiveUserData, offscreenCanvas.width, offscreenCanvas.height);
          });
        }
      }
    },
    [
      stageRef,
      layers,
      activeLayerId,
      tool,
      strokeColor,
      fillColor,
      tolerance,
      strokeWidth,
      setLayers,
      handleGlobalPointerMove,
      handleGlobalPointerUp,
      gridSize,
      canvasType,
    ],
  );

  const proceedWithFloodFill = (
    ctx: CanvasRenderingContext2D,
    pos: { x: number; y: number },
    userData: UserLayerData,
    canvasWidth: number,
    canvasHeight: number,
  ) => {
    const pixelData = ctx.getImageData(Math.floor(pos.x), Math.floor(pos.y), 1, 1).data;
    const targetRgba = { r: pixelData[0], g: pixelData[1], b: pixelData[2], a: pixelData[3] };

    const colorService = Color(fillColor);
    const currentFillRgba = {
      r: colorService.red(),
      g: colorService.green(),
      b: colorService.blue(),
      a: Math.round(colorService.alpha() * 255),
    };

    if (
      colorsMatch(
        targetRgba.r,
        targetRgba.g,
        targetRgba.b,
        targetRgba.a,
        currentFillRgba.r,
        currentFillRgba.g,
        currentFillRgba.b,
        currentFillRgba.a,
        tolerance,
      )
    ) {
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
      setLayers((prevLayers) =>
        prevLayers.map((l) => (l.id === activeLayerId ? { ...l, rasterDataUrl: newFilledDataUrl } : l)),
      );
    }
    offscreenCtxRef.current = null;
  };

  const handleInteractionMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!isDrawing.current || !activeLayerId || (tool !== "pen" && tool !== "eraser")) return;

      // This function is now largely superseded by handleGlobalPointerMove for pen/eraser.
      // If the mouse/touch remains within the Konva Stage, this would still fire.
      // However, handleGlobalPointerMove will also fire.
      // To prevent double processing or conflicting updates, we can make this a no-op
      // when global listeners are active for drawing.
      // The global listeners are preferred as they track outside the canvas.

      // For non-pen/eraser tools, or if not drawing, this might still be relevant.
      // For now, let's assume pen/eraser drawing is fully handled by global listeners.

      // const stage = stageRef.current;
      // const pos = getPointerPosition(stage);
      // const line = currentKonvaLineRef.current;

      // if (!pos || !line || !stage) return;

      // e.evt.preventDefault();
      // e.cancelBubble = true;

      // const newPoints = line.points().concat([pos.x, pos.y]);
      // line.points(newPoints);

      // const layer = line.getLayer();
      // if (layer) {
      //   layer.batchDraw();
      // } else {
      //   stage.batchDraw(); // Fallback if layer somehow not found, though unlikely
      // }
    },
    [activeLayerId, tool, stageRef],
  );

  // Effect for cleaning up window event listeners if the component unmounts
  useEffect(() => {
    // Need to ensure the *actual* functions passed to removeEventListener are the same as addEventListener.
    // This means handleGlobalPointerMove and handleGlobalPointerUp need to be stable references (which they are via useCallback).
    const currentHandleGlobalPointerMove = handleGlobalPointerMove;
    const currentHandleGlobalPointerUp = handleGlobalPointerUp;

    return () => {
      window.removeEventListener("mousemove", currentHandleGlobalPointerMove);
      window.removeEventListener("touchmove", currentHandleGlobalPointerMove);
      window.removeEventListener("mouseup", currentHandleGlobalPointerUp);
      window.removeEventListener("touchend", currentHandleGlobalPointerUp);
    };
  }, [handleGlobalPointerMove, handleGlobalPointerUp]);

  return { handleInteractionStart, handleInteractionMove, handleInteractionEnd, isDrawingRef: isDrawing };
};

// Add the new helper function renderVectorShapesToContext
async function renderVectorShapesToContext(
  ctx: CanvasRenderingContext2D,
  shapes: VectorShapeData[],
  canvasRenderConfig: { width: number; height: number; pixelRatio: number },
): Promise<void> {
  if (!shapes || shapes.length === 0) {
    return;
  }

  const tempStage = new Konva.Stage({
    container: document.createElement("div"),
    width: canvasRenderConfig.width / canvasRenderConfig.pixelRatio,
    height: canvasRenderConfig.height / canvasRenderConfig.pixelRatio,
    pixelRatio: canvasRenderConfig.pixelRatio,
  });
  const tempLayer = new Konva.Layer();
  tempStage.add(tempLayer);

  shapes.forEach((shapeData) => {
    if (shapeData.tool === "pen" || shapeData.tool === "eraser") {
      if (shapeData.type === "pixels" && shapeData.pixels) {
        // Render pixels
        shapeData.pixels.forEach(pixel => {
          const rect = new Konva.Rect({
            x: pixel.x,
            y: pixel.y,
            width: pixel.width,
            height: pixel.height,
            fill: shapeData.stroke,
            globalCompositeOperation: shapeData.globalCompositeOperation,
            perfectDrawEnabled: false,
            listening: false,
          });
          tempLayer.add(rect);
        });
      } else if (shapeData.points) {
        // Render line
        const line = new Konva.Line({
          points: shapeData.points,
          stroke: shapeData.stroke,
          strokeWidth: shapeData.strokeWidth,
          lineCap: shapeData.lineCap || "round",
          lineJoin: shapeData.lineJoin || "round",
          tension: shapeData.tension || 0, // Default tension if not set
          globalCompositeOperation: shapeData.globalCompositeOperation,
          perfectDrawEnabled: false,
          listening: false,
        });
        tempLayer.add(line);
      }
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
