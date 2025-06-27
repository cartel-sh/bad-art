import { UserLayerData, VectorShapeData } from "@/lib/types";
import Konva from "konva";
import { ImageOff } from "lucide-react";
import React, { useEffect, useRef } from "react";

interface LayerPreviewProps {
  layerData: UserLayerData;
  thumbWidth: number;
  thumbHeight: number;
  mainCanvasWidth: number;
  mainCanvasHeight: number;
}

const LayerPreview: React.FC<LayerPreviewProps> = ({
  layerData,
  thumbWidth,
  thumbHeight,
  mainCanvasWidth,
  mainCanvasHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mainCanvasWidth === 0 || mainCanvasHeight === 0) {
      stageRef.current?.destroy();
      stageRef.current = null;
      containerRef.current.innerHTML = "";
      return;
    }

    if (!stageRef.current) {
      stageRef.current = new Konva.Stage({
        container: containerRef.current,
        width: thumbWidth,
        height: thumbHeight,
        listening: false,
      });
    } else {
      stageRef.current.width(thumbWidth);
      stageRef.current.height(thumbHeight);
    }

    let konvaLayer = stageRef.current.findOne<Konva.Layer>("Layer");
    if (konvaLayer) {
      konvaLayer.destroyChildren(); // Clear existing content if layer persists
    } else {
      konvaLayer = new Konva.Layer();
      stageRef.current.add(konvaLayer);
    }

    // 1. Add solid background
    const background = new Konva.Rect({
      x: 0,
      y: 0,
      width: thumbWidth,
      height: thumbHeight,
      fill: "#FFFFFF", // White background, can be changed to checkerboard later
      listening: false,
    });
    konvaLayer.add(background);

    const drawContent = () => {
      // 2. Draw raster data if available
      const rasterPromise = layerData.rasterDataUrl
        ? new Promise<void>((resolve) => {
            Konva.Image.fromURL(
              layerData.rasterDataUrl!,
              (img) => {
                img.setAttrs({
                  width: thumbWidth, // Fit image to thumb dimensions
                  height: thumbHeight,
                  listening: false,
                });
                konvaLayer.add(img); // Added on top of background
                resolve();
              },
              () => {
                console.warn("Failed to load raster image for preview for layer: " + layerData.name);
                resolve(); // Resolve even on error to proceed to vectors
              },
            );
          })
        : Promise.resolve();

      rasterPromise.then(() => {
        // 3. Draw vector shapes on top
        if (layerData.vectorShapes && layerData.vectorShapes.length > 0) {
          const scaleX = thumbWidth / mainCanvasWidth;
          const scaleY = thumbHeight / mainCanvasHeight;
          const scale = Math.min(scaleX, scaleY);

          const scaledContentActualWidth = mainCanvasWidth * scale;
          const scaledContentActualHeight = mainCanvasHeight * scale;
          const offsetX = (thumbWidth - scaledContentActualWidth) / 2;
          const offsetY = (thumbHeight - scaledContentActualHeight) / 2;

          layerData.vectorShapes.forEach((shapeData: VectorShapeData) => {
            if ((shapeData.tool === "pen" || shapeData.tool === "eraser") && shapeData.points) {
              const scaledPoints = shapeData.points.map((val, idx) =>
                idx % 2 === 0 ? val * scale + offsetX : val * scale + offsetY,
              );
              const line = new Konva.Line({
                points: scaledPoints,
                stroke: shapeData.stroke,
                strokeWidth: Math.max(0.5, (shapeData.strokeWidth || 1) * scale), // Ensure stroke is visible, default 1 if undefined
                lineCap: "round",
                lineJoin: "round",
                tension: shapeData.tension || 0,
                globalCompositeOperation: shapeData.globalCompositeOperation,
                perfectDrawEnabled: false,
                listening: false,
              });
              konvaLayer.add(line); // Added on top of raster/background
            }
          });
        }
        konvaLayer.batchDraw();
      });
    };

    drawContent();

    return () => {
      stageRef.current?.destroy();
      stageRef.current = null;
    };
  }, [layerData, thumbWidth, thumbHeight, mainCanvasWidth, mainCanvasHeight]);

  return <div ref={containerRef} style={{ width: thumbWidth, height: thumbHeight, overflow: "hidden" }} />;
};

export default LayerPreview;
