"use client";

import React, { useState, useRef, useEffect, use } from 'react';
import { Stage, Layer, Line, Rect, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { Button } from '@/components/ui/button';
import Toolbar, { Tool as ToolbarUITool } from '../../../components/canvas/toolbar';
import { colorsMatch, performFloodFill, hexToRgba, getPointerPosition } from '@/lib/drawing';
import LayersPanel from '@/components/canvas/layers';
import { useDrawingInteractions } from '@/hooks/useDrawingInteractions';
import { UserLayerData, ToolbarTool } from '@/lib/types';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

export default function DrawPage({ params }: { params: Promise<{ id: string }> }) {
  const props = use(params);
  const [tool, setTool] = useState<ToolbarUITool>('pen');

  const [layers, setLayers] = useState<UserLayerData[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  const [layerImageElements, setLayerImageElements] = useState<{ [key: string]: HTMLImageElement }>({});

  const [fillColor, setFillColor] = useState<string>('#000000');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [tolerance, setTolerance] = useState<number>(20);
  const [strokeWidth, setStrokeWidth] = useState<number>(5);

  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);

  const {
    handleInteractionStart,
    handleInteractionMove,
    handleInteractionEnd
  } = useDrawingInteractions({
    tool,
    layers,
    setLayers,
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

    setLayers([initialLayer]);
    setActiveLayerId(initialLayerId);

  }, []);

  useEffect(() => {
    layers.forEach(layer => {
      if (layer.rasterDataUrl && (!layerImageElements[layer.id] || layerImageElements[layer.id].src !== layer.rasterDataUrl)) {
        const img = new window.Image();
        img.onload = () => {
          setLayerImageElements(prev => ({ ...prev, [layer.id]: img }));
        };
        img.onerror = () => {
          console.error(`Failed to load raster image for layer ${layer.id}`);
        };
        img.src = layer.rasterDataUrl;
      } else if (!layer.rasterDataUrl && layerImageElements[layer.id]) {
        setLayerImageElements(prev => {
          const updated = { ...prev };
          delete updated[layer.id];
          return updated;
        });
      }
    });
  }, [layers, layerImageElements]);

  const handleSetActiveLayer = (layerId: string) => {
    setActiveLayerId(layerId);
  };

  const handleToggleLayerVisibility = (layerId: string) => {
    setLayers(prevLayers =>
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
      ctx.fillStyle = "rgba(255, 255, 255, 0)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      newRasterDataUrl = offscreenCanvas.toDataURL();
    } else {
      newRasterDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/mazYAAAAABJRU5ErkJggg==";
    }

    const newLayer: UserLayerData = {
      id: newLayerId,
      name: `Layer ${layers.length + 1}`,
      isVisible: true,
      opacity: 1,
      rasterDataUrl: newRasterDataUrl,
    };
    setLayers(prevLayers => [...prevLayers, newLayer]);
    setActiveLayerId(newLayerId);
  };

  const handleDeleteLayer = (layerId: string) => {
    setLayers(prevLayers => prevLayers.filter(l => l.id !== layerId));
    if (activeLayerId === layerId) {
      const remainingLayers = layers.filter(l => l.id !== layerId);
      setActiveLayerId(remainingLayers.length > 0 ? remainingLayers[0].id : null);
    }
  };

  return (
    <div className="relative h-screen w-screen bg-gray-100 flex items-center justify-center">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
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

      <div className="flex items-center justify-center border border-gray-300 rounded-md bg-gray-200">
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

      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
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
    </div>
  );
} 