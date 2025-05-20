"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { SkeletonCard } from "@/components/post-skeleton";
import { UserLayerData, VectorShapeData } from "@/lib/types";
import Konva from 'konva';
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const ALL_DRAWINGS_STORAGE_KEY = 'drawings-storage';
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

interface ProcessedSketch {
  id: string;
  previewUrl: string | null;
  name?: string;
}

async function generateSketchPreview(
  layers: UserLayerData[],
  width: number,
  height: number
): Promise<string | null> {
  if (!layers || layers.length === 0) return null;

  const containerDiv = document.createElement('div');
  // Optionally set dimensions on the container if Konva requires it,
  // but usually stage dimensions are primary.
  // containerDiv.style.width = `${width}px`;
  // containerDiv.style.height = `${height}px`;

  const stage = new Konva.Stage({
    container: containerDiv,
    width: width,
    height: height,
  });

  const imageLoadPromises: Promise<void>[] = [];

  for (const userLayer of layers) {
    if (!userLayer.isVisible) continue;

    const konvaLayer = new Konva.Layer({
      opacity: userLayer.opacity,
    });

    const addVectorShapesToLayer = () => {
      userLayer.vectorShapes.forEach((shape: VectorShapeData) => {
        if (shape.tool === 'pen' || shape.tool === 'eraser') {
          const op = shape.globalCompositeOperation || 'source-over';
          const line = new Konva.Line({
            points: shape.points,
            stroke: shape.stroke,
            strokeWidth: shape.strokeWidth,
            lineCap: 'round',
            lineJoin: 'round',
            tension: shape.tension !== undefined ? shape.tension : 0.1,
            globalCompositeOperation: op as Konva.LineConfig['globalCompositeOperation'],
            perfectDrawEnabled: false,
            listening: false,
          });
          konvaLayer.add(line);
        }
      });
    };

    if (userLayer.rasterDataUrl) {
      const promise = new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          const konvaImage = new Konva.Image({
            image: img,
            width: width,
            height: height,
            listening: false,
          });
          konvaLayer.add(konvaImage); // Add raster image first
          addVectorShapesToLayer();    // Then add vector shapes on top
          resolve();
        };
        img.onerror = () => {
          console.error(`Failed to load raster image for preview (layer ${userLayer.id})`);
          addVectorShapesToLayer(); // Still attempt to draw vector shapes
          resolve(); // Resolve anyway to not block preview generation
        };
        img.src = userLayer.rasterDataUrl || '';
      });
      imageLoadPromises.push(promise);
    } else {
      // No raster data, just add vector shapes
      addVectorShapesToLayer();
    }

    stage.add(konvaLayer);
  }

  await Promise.all(imageLoadPromises);

  // Ensure all layers are drawn
  stage.draw();

  const dataURL = stage.toDataURL({
    mimeType: 'image/png',
    quality: 0.8, // Adjust quality as needed
    pixelRatio: 0.5 // Generate a smaller preview, adjust as needed
  });

  stage.destroy();
  return dataURL;
}

export default function SketchesPage() {
  const router = useRouter();
  const [sketches, setSketches] = useState<ProcessedSketch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSketches, setSelectedSketches] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState<boolean>(false);

  // Prevent any drag operations
  const preventDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  const handleCardClick = (sketchId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (selectMode) {
      toggleSketchSelection(sketchId);
    } else {
      router.push(`/draw/${sketchId}`);
    }
  };

  const toggleSketchSelection = (sketchId: string) => {
    setSelectedSketches(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(sketchId)) {
        newSelected.delete(sketchId);
      } else {
        newSelected.add(sketchId);
      }
      return newSelected;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedSketches.size === 0) return;

    try {
      const allSavedDrawingsJSON = localStorage.getItem(ALL_DRAWINGS_STORAGE_KEY);
      if (allSavedDrawingsJSON) {
        const allDrawings: { [key: string]: UserLayerData[] } = JSON.parse(allSavedDrawingsJSON);
        selectedSketches.forEach(sketchId => {
          delete allDrawings[sketchId];
        });
        localStorage.setItem(ALL_DRAWINGS_STORAGE_KEY, JSON.stringify(allDrawings));

        setSketches(prevSketches =>
          prevSketches.filter(sketch => !selectedSketches.has(sketch.id))
        );
        setSelectedSketches(new Set());
        // Optionally, exit select mode after deletion
        // setSelectMode(false);
      }
    } catch (e) {
      console.error("Failed to delete sketches:", e);
      setError("Failed to delete selected sketches.");
    }
  };

  const handleToggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) { // Was true, now turning off
      setSelectedSketches(new Set()); // Clear selection when exiting select mode
    }
  };

  useEffect(() => {
    const loadSketches = async () => {
      setLoading(true);
      setError(null);
      try {
        const allSavedDrawingsJSON = localStorage.getItem(ALL_DRAWINGS_STORAGE_KEY);
        if (!allSavedDrawingsJSON) {
          setSketches([]);
          setLoading(false);
          return;
        }

        const allDrawings: { [key: string]: UserLayerData[] } = JSON.parse(allSavedDrawingsJSON);

        const sketchPromises = Object.entries(allDrawings).map(async ([drawingId, layers]) => {
          if (!layers || layers.length === 0) {
            return {
              id: drawingId,
              previewUrl: null,
              name: drawingId,
            };
          }

          const previewUrl = await generateSketchPreview(layers, CANVAS_WIDTH, CANVAS_HEIGHT);
          const drawingName = layers[0]?.name ? layers[0].name.split(' ')[0] + "..." : drawingId;

          return {
            id: drawingId,
            previewUrl: previewUrl,
            name: drawingName,
          };
        });

        const processedSketches = (await Promise.all(sketchPromises))
          .filter(sketch => sketch.id) as ProcessedSketch[];

        setSketches(processedSketches.reverse()); // Show newest first
      } catch (e: any) {
        console.error("Failed to load sketches from localStorage:", e);
        setError(e.message || "Failed to load sketches.");
        setSketches([]);
      } finally {
        setLoading(false);
      }
    };

    loadSketches();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mx-auto max-w-screen-sm gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 p-4 text-center">Error loading sketches: {error}</p>;
  }

  if (sketches.length === 0) {
    return <p className="p-4 text-center">No sketches found. <Link href="/" className="text-primary hover:underline">Start drawing!</Link></p>;
  }

  return (
    <div className="container mx-auto px-4 py-8 h-full overflow-y-auto no-scrollbar relative">
      {selectMode && selectedSketches.size > 0 && (
        <Button
          onClick={handleDeleteSelected}
          variant="default"
          className="fixed top-5 right-26 z-10"
        >
          Delete Selected ({selectedSketches.size})
        </Button>
      )}

      <Button
        onClick={handleToggleSelectMode}
        variant={selectMode ? "secondary" : "outline"}
        className="fixed top-5 right-4 z-10"
      >
        {selectMode ? 'Cancel' : 'Select'}
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-screen-sm mx-auto gap-6 pt-14">
        {sketches.map((sketch) => {
          const imageAlt = `Sketch ${sketch.name || sketch.id}`;
          const isSelected = selectedSketches.has(sketch.id);

          return (
            <div
              key={sketch.id}
              className="no-drag"
              onClick={(e) => handleCardClick(sketch.id, e)}
            >
              <div
                className={`relative cursor-pointer group ${selectMode ? 'cursor-pointer' : 'cursor-default'} select-none no-drag`}
                draggable="false"
              >
                {selectMode && isSelected && (
                  <div className="absolute top-2 right-2 z-10 bg-primary text-white rounded-full p-1 text-xs">
                    <Check size={16} />
                  </div>
                )}
                <motion.div
                  layoutId={`${sketch.id}`}
                  className={`select-none no-drag block bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl group-hover:shadow-2xl transition-shadow duration-300 ease-in-out aspect-[1/1] ${selectMode && isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  draggable={false}
                  drag={false}
                >
                  {sketch.previewUrl ? (
                    <div className="relative w-full h-full">
                      <img
                        src={sketch.previewUrl}
                        alt={imageAlt}
                        draggable="false"
                        className="w-full select-none pointer-events-none h-full object-cover no-drag absolute"
                        onDragStart={preventDrag}
                        onMouseDown={preventDrag}
                        onTouchStart={preventDrag}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                      <p className="text-gray-500 dark:text-gray-400">No preview available</p>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 