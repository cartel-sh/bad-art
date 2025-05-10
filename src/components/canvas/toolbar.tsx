"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Eraser, PaintBucket, Palette } from 'lucide-react';

export type Tool = 'pen' | 'eraser' | 'bucket';

interface ToolbarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  setStrokeColor: (color: string) => void;
  tolerance: number;
  setTolerance: (tolerance: number) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  fillColor,
  setFillColor,
  setStrokeColor,
  tolerance,
  setTolerance,
}) => {
  const handleColorChange = (newColor: string) => {
    setFillColor(newColor);
    if (tool === 'pen') {
      setStrokeColor(newColor);
    }
  };

  return (
    <div className="p-1 bg-secondary/10 shadow-lg rounded-lg border border-border flex flex-col space-y-2">
      <div className="flex flex-col space-y-1 items-center">
        <Button
          variant={tool === 'pen' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setTool('pen')}
          title="Pen"
          className={`w-10 h-10 ${tool !== 'pen' ? 'text-primary-foreground' : ''}`}
        >
          <Pencil className="h-5 w-5" />
        </Button>
        <Button
          variant={tool === 'eraser' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setTool('eraser')}
          title="Eraser"
          className={`w-10 h-10 ${tool !== 'eraser' ? 'text-primary-foreground' : ''}`}
        >
          <Eraser className="h-5 w-5" />
        </Button>
        <Button
          variant={tool === 'bucket' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setTool('bucket')}
          title="Bucket"
          className={`w-10 h-10 ${tool !== 'bucket' ? 'text-primary-foreground' : ''}`}
        >
          <PaintBucket className="h-5 w-5" />
        </Button>
      </div>

      <div className="pt-4 space-y-3">
        <div>
          <label htmlFor="toolbarFillColor" className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <div className="flex items-center space-x-2">
            <Palette className="h-5 w-5 text-gray-500" />
            <input
              type="color"
              id="toolbarFillColor"
              value={fillColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-full h-8 p-1 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
        </div>
        {tool === 'bucket' && (
          <div>
            <label htmlFor="toolbarTolerance" className="block text-sm font-medium text-gray-700 mb-1">
              Fill Tolerance ({tolerance})
            </label>
            <input
              type="range"
              id="toolbarTolerance"
              min="0"
              max="255"
              value={tolerance}
              onChange={(e) => setTolerance(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar; 