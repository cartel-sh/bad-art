"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Trash2, PlusSquare, ImageOff, GripVertical, XIcon } from 'lucide-react';
import { UserLayerData } from '@/lib/types';
import LayerPreview from './layer-preview';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragCancelEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScrollArea, ScrollAreaViewport, ScrollAreaScrollbar, ScrollAreaThumb } from '@radix-ui/react-scroll-area';

export interface LayersPanelProps {
  layers: UserLayerData[];
  activeLayerId: string | null;
  onSetActiveLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onReorderLayers: (activeId: string, overId: string | null) => void;
  mainCanvasWidth: number;
  mainCanvasHeight: number;
}

const THUMB_SIZE = 32;

interface LayerItemProps {
  layer: UserLayerData;
  activeLayerId: string | null;
  onSetActiveLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  canDelete: boolean;
  mainCanvasWidth: number;
  mainCanvasHeight: number;
  isDraggingOveral: boolean;
}

const LayerItem: React.FC<LayerItemProps> = ({
  layer,
  activeLayerId,
  onSetActiveLayer,
  onToggleVisibility,
  onDeleteLayer,
  canDelete,
  mainCanvasWidth,
  mainCanvasHeight,
  isDraggingOveral,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-1 p-1.5 rounded-md border cursor-pointer
          ${layer.id === activeLayerId
          ? 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50'
          : 'hover:bg-input/20 border-border/80'}
          ${isDragging ? 'shadow-xl bg-secondary' : ''}`}
      onClick={() => onSetActiveLayer(layer.id)}
    >
      <button {...attributes} {...listeners} className="p-0.5 cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="h-4 w-4 text-secondary-foreground/50" />
      </button>
      <div className="w-8 h-8 rounded border border-border/50 bg-secondary/30 flex items-center justify-center overflow-hidden">
        {(layer.rasterDataUrl || (layer.vectorShapes && layer.vectorShapes.length > 0)) && mainCanvasWidth > 0 && mainCanvasHeight > 0 ? (
          <LayerPreview
            layerData={layer}
            thumbWidth={THUMB_SIZE}
            thumbHeight={THUMB_SIZE}
            mainCanvasWidth={mainCanvasWidth}
            mainCanvasHeight={mainCanvasHeight}
          />
        ) : (
          <ImageOff className="w-4 h-4 text-secondary-foreground/50" />
        )}
      </div>
      <span className="flex-grow text-xs truncate text-secondary-foreground/90" title={layer.name}>
        {layer.name}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility(layer.id);
        }}
        title={layer.isVisible ? 'Hide Layer' : 'Show Layer'}
        className="text-secondary-foreground/70 hover:text-accent-foreground h-6 w-6"
      >
        {layer.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </Button>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteLayer(layer.id);
          }}
          title="Delete Layer"
          className="text-secondary-foreground/70 hover:text-accent-foreground h-6 w-6"
        >
          <XIcon className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};

const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSetActiveLayer,
  onToggleVisibility,
  onAddLayer,
  onDeleteLayer,
  onReorderLayers,
  mainCanvasWidth,
  mainCanvasHeight,
}) => {
  const [isDraggingList, setIsDraggingList] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setIsDraggingList(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDraggingList(false);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderLayers(active.id as string, over.id as string);
    }
  };

  const handleDragCancel = (event: DragCancelEvent) => {
    setIsDraggingList(false);
  };

  const layerIds = layers.map(l => l.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={layerIds} strategy={verticalListSortingStrategy}>
        <div className="w-60 p-1 shadow-lg rounded-lg bg-secondary border border-border flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm px-2 py-1 font-semibold text-secondary-foreground">Layers</h3>
            <Button variant="ghost" size="icon" onClick={onAddLayer} title="Add New Layer" className="text-secondary-foreground hover:text-accent-foreground h-7 w-7">
              <PlusSquare className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <ScrollArea className="">
              <ScrollAreaViewport className="max-h-64 overflow-auto w-full h-full pr-2 rounded">
                <div className="flex flex-col gap-1 p-0.5">
                  {layers.slice().reverse().map((layer) => (
                    <LayerItem
                      key={layer.id}
                      layer={layer}
                      activeLayerId={activeLayerId}
                      onSetActiveLayer={onSetActiveLayer}
                      onToggleVisibility={onToggleVisibility}
                      onDeleteLayer={onDeleteLayer}
                      canDelete={layers.length > 1}
                      mainCanvasWidth={mainCanvasWidth}
                      mainCanvasHeight={mainCanvasHeight}
                      isDraggingOveral={isDraggingList}
                    />
                  ))}
                </div>
              </ScrollAreaViewport>
              <ScrollAreaScrollbar orientation="vertical" className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-[160ms] ease-out data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5">
                <ScrollAreaThumb className="flex-1 bg-border rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
              </ScrollAreaScrollbar>
            </ScrollArea>
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default LayersPanel; 