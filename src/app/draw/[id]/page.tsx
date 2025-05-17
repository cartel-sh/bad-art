"use client";

import React, { useState, useRef, useEffect, use, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { Button } from '@/components/ui/button';
import Toolbar, { Tool as ToolbarUITool } from '../../../components/canvas/toolbar';
import { colorsMatch, getPointerPosition } from '@/lib/drawing';
import LayersPanel from '@/components/canvas/layers';
import HistoryControls from '@/components/canvas/history';
import { useDrawingInteractions } from '@/hooks/use-interactions';
import { UserLayerData, ToolbarTool } from '@/lib/types';
import { Undo, Redo } from 'lucide-react';
import { arrayMove } from '@dnd-kit/sortable';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

export interface UpdateHistoryOptions {
  skipHistory?: boolean;
}

export default function DrawPage({ params }: { params: Promise<{ id: string }> }) {
  const props = use(params);
  const [tool, setTool] = useState<ToolbarUITool>('pen');

  const [layers, setLayersInternal] = useState<UserLayerData[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  const [layerImageElements, setLayerImageElements] = useState<{ [key: string]: HTMLImageElement }>({});

  const [fillColor, setFillColor] = useState<string>('#000000');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [tolerance, setTolerance] = useState<number>(20);
  const [strokeWidth, setStrokeWidth] = useState<number>(5);

  const stageRef = useRef<Konva.Stage>(null);

  const [history, setHistory] = useState<UserLayerData[][]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);

  const MAX_HISTORY_LENGTH = 50;

  const updateLayersAndHistory = useCallback((
    newLayersProvider: UserLayerData[] | ((prevState: UserLayerData[]) => UserLayerData[]),
    options?: UpdateHistoryOptions
  ) => {
    setLayersInternal(prevActualLayers => {
      const newLayers = typeof newLayersProvider === 'function' ? newLayersProvider(prevActualLayers) : newLayersProvider;

      if (!options?.skipHistory) {
        setHistory(prevHistory => {
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
  }, [currentHistoryIndex, MAX_HISTORY_LENGTH]);

  const {
    handleInteractionStart,
    handleInteractionMove,
    handleInteractionEnd
  } = useDrawingInteractions({
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
    const initialLayerId = `layer-${Date.now()}`;
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext('2d');
    let initialRasterDataUrl = null;

    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      initialRasterDataUrl = offscreenCanvas.toDataURL();
    } else {
      initialRasterDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/mazYAAAAABJRU5ErkJggg==";
    }

    const initialLayer: UserLayerData = {
      id: initialLayerId,
      name: 'Layer 1',
      isVisible: true,
      opacity: 1,
      rasterDataUrl: initialRasterDataUrl,
      vectorShapes: [],
    };

    setLayersInternal([initialLayer]);
    setHistory([[initialLayer]]);
    setCurrentHistoryIndex(0);
    setActiveLayerId(initialLayerId);

  }, []);

  useEffect(() => {
    const newImageElements: { [key: string]: HTMLImageElement } = {};
    let allLoaded = true;
    let imageLoadPromises: Promise<void>[] = [];

    layers.forEach(layer => {
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
    } else if (Object.keys(newImageElements).length !== Object.keys(layerImageElements).length ||
      !Object.keys(newImageElements).every(key => layerImageElements[key])) {
      setLayerImageElements(newImageElements);
    }

  }, [layers]);

  const handleSetActiveLayer = (layerId: string) => {
    setActiveLayerId(layerId);
  };

  const handleToggleLayerVisibility = (layerId: string) => {
    updateLayersAndHistory(prevLayers =>
      prevLayers.map(l =>
        l.id === layerId ? { ...l, isVisible: !l.isVisible } : l
      )
    );
  };

  const handleAddLayer = () => {
    const newLayerId = `layer-${Date.now()}`;
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext('2d');
    let newRasterDataUrl = null;

    if (ctx) {
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      newRasterDataUrl = offscreenCanvas.toDataURL();
    } else {
      newRasterDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwAB/aurHAAAAABJRU5ErkJggg==";
    }

    const newLayer: UserLayerData = {
      id: newLayerId,
      name: `Layer ${layers.length + 1}`,
      isVisible: true,
      opacity: 1,
      rasterDataUrl: newRasterDataUrl,
      vectorShapes: [],
    };
    updateLayersAndHistory(prevLayers => [...prevLayers, newLayer]);
    setActiveLayerId(newLayerId);
  };

  const handleDeleteLayer = (layerId: string) => {
    updateLayersAndHistory(prevLayers => {
      const newLayers = prevLayers.filter(l => l.id !== layerId);
      if (activeLayerId === layerId) {
        const oldIndex = prevLayers.findIndex(l => l.id === layerId);
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
      if (isModKey && event.key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (isModKey && event.key === 'y') {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  const canUndo = currentHistoryIndex > 0;
  const canRedo = currentHistoryIndex < history.length - 1;

  const handleReorderLayers = (activeId: string, overId: string | null) => {
    if (!overId) return; // Should not happen if implemented correctly in LayersPanel

    setLayersInternal(currentLayers => {
      const oldIndex = currentLayers.findIndex(layer => layer.id === activeId);
      const newIndex = currentLayers.findIndex(layer => layer.id === overId);

      if (oldIndex === -1 || newIndex === -1) {
        return currentLayers; // Should not happen
      }

      // Note: The layers are displayed in reverse order in LayersPanel.
      // The `arrayMove` function expects indices based on the actual `layers` array order.
      // We need to convert the visual indices (which correspond to the reversed list)
      // to model indices (which correspond to the `layers` array).
      // However, dnd-kit works with the IDs directly from the `SortableContext`
      // items list (`layerIds`), which should match the `layers` state if `layerIds`
      // is derived directly from `layers.map(l => l.id)`.
      // The `LayersPanel` passes `active.id` and `over.id` which are the actual layer IDs.
      // So, we find their indices in the *current* `layers` array.

      // The visual order is reversed. If you drag item A (visually top) over item B (visually below A),
      // in the actual `layers` array (which is the source of truth), B comes *before* A.
      // When we reorder, we want A to come before B in the `layers` array to make A appear above B.

      // Let's consider the desired final state based on IDs.
      // activeId is the ID of the layer being dragged.
      // overId is the ID of the layer it's dropped onto.
      // In the UI, layers are shown .slice().reverse().
      // If you drag layer X onto layer Y (X is now visually above Y):
      // In the reversed list for display: ... Y, X, ...
      // In the actual `layers` array, this means: ..., X, Y, ... (X should have a higher index than Y if we want X above Y visually, since it's reversed)
      // NO, that's not right. The conventional display is top = low index.
      // If `layers` is `[L1, L2, L3]`, visually it's `L3, L2, L1` (top to bottom).
      // If I drag L1 (visually bottom) to be on top of L3 (visually top):
      // New visual: L1, L3, L2.
      // New actual `layers` array: `[L2, L3, L1]`.
      // So, if I drag `activeId` to be visually *above* `overId`:
      // In the `layers` array, `activeId` should end up at the index *after* `overId` if `activeId` was originally *before* `overId`.
      // Or at the index *of* `overId` if `activeId` was originally *after* `overId`.
      // This is standard array reordering logic. `arrayMove` handles this.

      return arrayMove(currentLayers, oldIndex, newIndex);
    });
  };

  return (
    <div className="relative h-screen w-screen bg-background/50 bg-foreground/50 flex flex-col items-center justify-center">
      <div className="absolute left-4 top-4 z-10">
        <Toolbar
          tool={tool}
          setTool={setTool}
          fillColor={fillColor}
          setFillColor={setFillColor}
          setStrokeColor={setStrokeColor}
          tolerance={tolerance}
          setTolerance={setTolerance}
        />
      </div>

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
          {layers.map(layer => {
            if (!layer.isVisible) {
              return null;
            }
            const imageElement = layerImageElements[layer.id];

            return (
              <Layer
                key={layer.id}
                id={layer.id}
                opacity={layer.opacity}
                visible={layer.isVisible}
                listening={false}
              >
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
                {layer.vectorShapes.map(shape => {
                  if (shape.tool === 'pen' || shape.tool === 'eraser') {
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

      <div className="absolute right-4 top-4 z-10">
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
        <p className="mt-2 text-xs text-gray-500">Drawing ID: {props.id}</p>
      </div>

      <div className="absolute bottom-4 left-4 z-10">
        <HistoryControls
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>
    </div>
  );
} 