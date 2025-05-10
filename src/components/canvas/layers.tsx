"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Trash2, PlusSquare, ImageOff } from 'lucide-react';
import { UserLayerData } from '@/lib/types'; // Import from new types.ts

export interface LayersPanelProps {
  layers: UserLayerData[];
  activeLayerId: string | null;
  onSetActiveLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  // onReorderLayer: (layerId: string, direction: 'up' | 'down') => void; // For future
  // onChangeOpacity: (layerId: string, opacity: number) => void; // For future
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSetActiveLayer,
  onToggleVisibility,
  onAddLayer,
  onDeleteLayer,
}) => {
  return (
    <div className="w-60 p-1 shadow-lg rounded-lg bg-secondary/20 border border-border flex flex-col space-y-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-primary-foreground">LAYERS</h3>
        <Button variant="ghost" size="icon" onClick={onAddLayer} title="Add New Layer" className="text-primary-foreground hover:text-accent-foreground h-7 w-7">
          <PlusSquare className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1 overflow-y-auto max-h-96 pr-1"> {/* Added padding-right for scrollbar */}
        {layers.slice().reverse().map((layer) => ( // Slice to reverse a copy for Photoshop-like top-first order
          <div
            key={layer.id}
            className={`flex items-center space-x-2 p-1.5 rounded-md border cursor-pointer hover:bg-secondary/30
                        ${layer.id === activeLayerId ? 'bg-primary/20 border-primary shadow-inner' : 'border-border/70'}`}
            onClick={() => onSetActiveLayer(layer.id)}
          >
            <div className="w-8 h-8 rounded border border-border/50 bg-secondary/30 flex items-center justify-center overflow-hidden">
              {layer.rasterDataUrl ? (
                <img src={layer.rasterDataUrl} alt={layer.name} className="w-full h-full object-contain" />
              ) : (
                <ImageOff className="w-4 h-4 text-primary-foreground/50" />
              )}
            </div>
            <span className="flex-grow text-xs truncate text-primary-foreground/90" title={layer.name}>
              {layer.name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation(); // Prevent setting active layer when clicking button
                onToggleVisibility(layer.id);
              }}
              title={layer.isVisible ? 'Hide Layer' : 'Show Layer'}
              className="text-primary-foreground/70 hover:text-accent-foreground h-6 w-6"
            >
              {layer.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </Button>
            {layers.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLayer(layer.id);
                }}
                title="Delete Layer"
                className="text-destructive/70 hover:text-destructive h-6 w-6"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayersPanel; 