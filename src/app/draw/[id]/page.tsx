"use client";

import React, { useState, useRef, useEffect, use, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { Button } from '@/components/ui/button';
import Toolbar, { Tool as ToolbarUITool } from '../../../components/canvas/toolbar';
import { colorsMatch, performFloodFill, hexToRgba, getPointerPosition } from '@/lib/drawing';
import LayersPanel from '@/components/canvas/layers';
import HistoryControls from '@/components/canvas/history';
import { useDrawingInteractions } from '@/hooks/use-interactions';
import { UserLayerData, ToolbarTool } from '@/lib/types';
import { Undo, Redo } from 'lucide-react';

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
  const layerRef = useRef<Konva.Layer>(null);

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

  return (
    <div className="relative h-screen w-screen bg-gray-100 flex flex-col items-center justify-center">
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

      <div className="flex items-center justify-center border border-gray-300 rounded-md bg-gray-200 shadow-lg">
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
          <Layer ref={layerRef}>
            {layers.map(layer => {
              if (!layer.isVisible) {
                return null;
              }
              const imageElement = layerImageElements[layer.id];

              return (
                <React.Fragment key={layer.id}>
                  {imageElement && layer.rasterDataUrl && (
                    <KonvaImage
                      image={imageElement}
                      x={0}
                      y={0}
                      width={CANVAS_WIDTH}
                      height={CANVAS_HEIGHT}
                      listening={false}
                      opacity={layer.opacity}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </Layer>
        </Stage>
      </div>

      <div className="absolute right-4 top-4 z-10">
        <LayersPanel
          layers={layers}
          activeLayerId={activeLayerId}
          onSetActiveLayer={handleSetActiveLayer}
          onToggleVisibility={handleToggleLayerVisibility}
          onAddLayer={handleAddLayer}
          onDeleteLayer={handleDeleteLayer}
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