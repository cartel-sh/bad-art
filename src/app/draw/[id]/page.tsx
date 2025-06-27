"use client";

import HistoryControls from "@/components/canvas/history";
import LayersPanel from "@/components/canvas/layers";
import PublishDialog from "@/components/canvas/publish-dialog";
import { Button } from "@/components/ui/button";
import { useDrawingInteractions } from "@/hooks/use-interactions";
import { colorsMatch, getPointerPosition } from "@/lib/drawing";
import { ToolbarTool, UserLayerData } from "@/lib/types";
import { arrayMove } from "@dnd-kit/sortable";
import Konva from "konva";
import { Redo, Undo } from "lucide-react";
import { motion } from "motion/react";
import React, { useState, useRef, useEffect, use, useCallback } from "react";
import { Image as KonvaImage, Layer, Line, Rect, Stage } from "react-konva";
import AutoSave from "../../../components/canvas/auto-save";
import Toolbar, { Tool as ToolbarUITool } from "../../../components/canvas/toolbar";

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

export interface UpdateHistoryOptions {
  skipHistory?: boolean;
}

export default function DrawPage({ params }: { params: Promise<{ id: string }> }) {
  const props = use(params);
  const [tool, setTool] = useState<ToolbarUITool>("pen");

  const [layers, setLayersInternal] = useState<UserLayerData[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  const [layerImageElements, setLayerImageElements] = useState<{ [key: string]: HTMLImageElement }>({});

  const [fillColor, setFillColor] = useState<string>("#000000");
  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [tolerance, setTolerance] = useState<number>(20);
  const [strokeWidth, setStrokeWidth] = useState<number>(5);

  const stageRef = useRef<Konva.Stage>(null);

  const [history, setHistory] = useState<UserLayerData[][]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState<boolean>(false);

  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState<boolean>(false);

  const MAX_HISTORY_LENGTH = 50;
  const ALL_DRAWINGS_STORAGE_KEY = "drawings-storage";

  const updateLayersAndHistory = useCallback(
    (
      newLayersProvider: UserLayerData[] | ((prevState: UserLayerData[]) => UserLayerData[]),
      options?: UpdateHistoryOptions,
    ) => {
      setLayersInternal((prevActualLayers) => {
        const newLayers =
          typeof newLayersProvider === "function" ? newLayersProvider(prevActualLayers) : newLayersProvider;

        if (!options?.skipHistory) {
          setHistory((prevHistory) => {
            const historyUpToCurrent = prevHistory.slice(0, currentHistoryIndex + 1);
            let updatedHistory = [...historyUpToCurrent, newLayers];

            if (updatedHistory.length > MAX_HISTORY_LENGTH) {
              updatedHistory = updatedHistory.slice(updatedHistory.length - MAX_HISTORY_LENGTH);
            }
            setCurrentHistoryIndex(updatedHistory.length - 1);
            return updatedHistory;
          });
        }
        return newLayers;
      });
    },
    [currentHistoryIndex, MAX_HISTORY_LENGTH],
  );

  const { handleInteractionStart, handleInteractionMove, handleInteractionEnd } = useDrawingInteractions({
    tool,
    layers,
    setLayers: updateLayersAndHistory,
    activeLayerId,
    fillColor,
    strokeColor,
    tolerance,
    strokeWidth,
    stageRef,
  });

  useEffect(() => {
    if (!props.id) return;

    const drawingId = props.id;
    const allSavedDrawingsJSON = localStorage.getItem(ALL_DRAWINGS_STORAGE_KEY);
    let allDrawings: { [key: string]: UserLayerData[] } = {};

    if (allSavedDrawingsJSON) {
      try {
        allDrawings = JSON.parse(allSavedDrawingsJSON);
      } catch (error) {
        console.error("Failed to parse all drawings from localStorage", error);
      }
    }

    const savedLayersForCurrentDrawing = allDrawings[drawingId];

    if (savedLayersForCurrentDrawing && savedLayersForCurrentDrawing.length > 0) {
      setLayersInternal(savedLayersForCurrentDrawing);
      setHistory([savedLayersForCurrentDrawing]);
      setCurrentHistoryIndex(0);
      setActiveLayerId(savedLayersForCurrentDrawing[savedLayersForCurrentDrawing.length - 1]?.id || null);
      setIsLoadedFromStorage(true);
      console.log(`Loaded drawing ${drawingId} from drawings-storage`);
      return;
    }

    const initialLayerId = `layer-${Date.now()}`;
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext("2d");
    let initialRasterDataUrl = null;

    if (ctx) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      initialRasterDataUrl = offscreenCanvas.toDataURL();
    } else {
      initialRasterDataUrl =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/mazYAAAAABJRU5ErkJggg==";
    }

    const initialLayer: UserLayerData = {
      id: initialLayerId,
      name: "Layer 1",
      isVisible: true,
      opacity: 1,
      rasterDataUrl: initialRasterDataUrl,
      vectorShapes: [],
    };

    setLayersInternal([initialLayer]);
    setHistory([[initialLayer]]);
    setCurrentHistoryIndex(0);
    setActiveLayerId(initialLayerId);
    setIsLoadedFromStorage(false);
  }, [props.id]);

  useEffect(() => {
    const newImageElements: { [key: string]: HTMLImageElement } = {};
    let allLoaded = true;
    const imageLoadPromises: Promise<void>[] = [];

    layers.forEach((layer) => {
      if (layer.rasterDataUrl) {
        if (layerImageElements[layer.id] && layerImageElements[layer.id].src === layer.rasterDataUrl) {
          newImageElements[layer.id] = layerImageElements[layer.id];
        } else {
          allLoaded = false;
          const img = new window.Image();
          const promise = new Promise<void>((resolve, reject) => {
            img.onload = () => {
              newImageElements[layer.id] = img;
              resolve();
            };
            img.onerror = () => {
              console.error(`Failed to load raster image for layer ${layer.id}`);
              resolve();
            };
          });
          img.src = layer.rasterDataUrl;
          imageLoadPromises.push(promise);
        }
      }
    });

    if (!allLoaded) {
      Promise.all(imageLoadPromises).then(() => {
        setLayerImageElements(newImageElements);
      });
    } else if (
      Object.keys(newImageElements).length !== Object.keys(layerImageElements).length ||
      !Object.keys(newImageElements).every((key) => layerImageElements[key])
    ) {
      setLayerImageElements(newImageElements);
    }
  }, [layers]);

  const handleSetActiveLayer = (layerId: string) => {
    setActiveLayerId(layerId);
  };

  const handleToggleLayerVisibility = (layerId: string) => {
    updateLayersAndHistory((prevLayers) =>
      prevLayers.map((l) => (l.id === layerId ? { ...l, isVisible: !l.isVisible } : l)),
    );
  };

  const handleAddLayer = () => {
    const newLayerId = `layer-${Date.now()}`;
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext("2d");
    let newRasterDataUrl = null;

    if (ctx) {
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      newRasterDataUrl = offscreenCanvas.toDataURL();
    } else {
      newRasterDataUrl =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwAB/aurHAAAAABJRU5ErkJggg==";
    }

    const newLayer: UserLayerData = {
      id: newLayerId,
      name: `Layer ${layers.length + 1}`,
      isVisible: true,
      opacity: 1,
      rasterDataUrl: newRasterDataUrl,
      vectorShapes: [],
    };
    updateLayersAndHistory((prevLayers) => [...prevLayers, newLayer]);
    setActiveLayerId(newLayerId);
  };

  const handleDeleteLayer = (layerId: string) => {
    updateLayersAndHistory((prevLayers) => {
      const newLayers = prevLayers.filter((l) => l.id !== layerId);
      if (activeLayerId === layerId) {
        const oldIndex = prevLayers.findIndex((l) => l.id === layerId);
        if (newLayers.length === 0) {
          setActiveLayerId(null);
        } else {
          const newActiveIndex = Math.max(0, Math.min(oldIndex, newLayers.length - 1));
          setActiveLayerId(newLayers[newActiveIndex].id);
        }
      }
      return newLayers;
    });
  };

  const handleUndo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      setLayersInternal(history[newIndex]);
    }
  }, [currentHistoryIndex, history]);

  const handleRedo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      setCurrentHistoryIndex(newIndex);
      setLayersInternal(history[newIndex]);
    }
  }, [currentHistoryIndex, history]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModKey = event.ctrlKey || event.metaKey;
      if (isModKey && event.key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (isModKey && event.key === "y") {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  const canUndo = currentHistoryIndex > 0;
  const canRedo = currentHistoryIndex < history.length - 1;

  const handleReorderLayers = (activeId: string, overId: string | null) => {
    if (!overId) return;

    setLayersInternal((currentLayers) => {
      const oldIndex = currentLayers.findIndex((layer) => layer.id === activeId);
      const newIndex = currentLayers.findIndex((layer) => layer.id === overId);

      if (oldIndex === -1 || newIndex === -1) {
        return currentLayers;
      }

      return arrayMove(currentLayers, oldIndex, newIndex);
    });
  };

  const handleOpenPublishDialog = () => {
    setIsPublishDialogOpen(true);
  };

  const handleClosePublishDialog = () => {
    setIsPublishDialogOpen(false);
  };

  const handlePublishDrawing = (slug: string) => {
    console.log("Publishing drawing:", slug);
    handleClosePublishDialog();
  };

  return (
    <div className="relative h-screen w-screen bg-background flex flex-col items-center justify-center">
      <motion.div
        className="absolute left-4 top-4 z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Toolbar
          tool={tool}
          setTool={setTool}
          fillColor={fillColor}
          setFillColor={setFillColor}
          setStrokeColor={setStrokeColor}
          tolerance={tolerance}
          setTolerance={setTolerance}
        />
      </motion.div>

      <div className="flex items-center justify-center border border-border rounded-md shadow-lg">
        <Stage
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleInteractionStart}
          onMousemove={handleInteractionMove}
          onMouseup={handleInteractionEnd}
          onTouchStart={handleInteractionStart}
          onTouchMove={handleInteractionMove}
          onTouchEnd={handleInteractionEnd}
          onContextMenu={(e) => e.evt.preventDefault()}
          ref={stageRef}
          className="rounded-md overflow-hidden"
        >
          {layers.map((layer) => {
            if (!layer.isVisible) {
              return null;
            }
            const imageElement = layerImageElements[layer.id];

            return (
              <Layer key={layer.id} id={layer.id} opacity={layer.opacity} visible={layer.isVisible} listening={false}>
                {imageElement && layer.rasterDataUrl && (
                  <KonvaImage
                    image={imageElement}
                    x={0}
                    y={0}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    listening={false}
                    opacity={1}
                  />
                )}
                {layer.vectorShapes.map((shape) => {
                  if (shape.tool === "pen" || shape.tool === "eraser") {
                    return (
                      <Line
                        key={shape.id}
                        id={shape.id}
                        points={shape.points}
                        stroke={shape.stroke}
                        strokeWidth={shape.strokeWidth}
                        lineCap="round"
                        lineJoin="round"
                        tension={shape.tension !== undefined ? shape.tension : 0.1}
                        globalCompositeOperation={shape.globalCompositeOperation}
                        perfectDrawEnabled={false}
                        listening={false}
                      />
                    );
                  }
                  return null;
                })}
              </Layer>
            );
          })}
        </Stage>
      </div>

      <motion.div
        className="absolute right-4 top-4 z-10"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <LayersPanel
          mainCanvasWidth={CANVAS_WIDTH}
          mainCanvasHeight={CANVAS_HEIGHT}
          layers={layers}
          activeLayerId={activeLayerId}
          onSetActiveLayer={handleSetActiveLayer}
          onToggleVisibility={handleToggleLayerVisibility}
          onAddLayer={handleAddLayer}
          onDeleteLayer={handleDeleteLayer}
          onReorderLayers={handleReorderLayers}
        />
      </motion.div>

      <motion.div
        className="absolute bottom-4 left-4 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <HistoryControls onUndo={handleUndo} onRedo={handleRedo} canUndo={canUndo} canRedo={canRedo} />
      </motion.div>
      <motion.div
        className="absolute bottom-4 right-4 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Button variant="secondary" onClick={handleOpenPublishDialog}>
          Finish
        </Button>
      </motion.div>
      <AutoSave
        layers={layers}
        drawingId={props.id}
        isLoadedFromStorage={isLoadedFromStorage}
        setIsLoadedFromStorage={setIsLoadedFromStorage}
        history={history}
        currentHistoryIndex={currentHistoryIndex}
        storageKey={ALL_DRAWINGS_STORAGE_KEY}
      />
      <PublishDialog
        isOpen={isPublishDialogOpen}
        onClose={handleClosePublishDialog}
        stageRef={stageRef}
        onPublish={handlePublishDrawing}
        layers={layers}
      />
    </div>
  );
}
