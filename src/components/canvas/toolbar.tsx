"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Eraser, PaintBucket, Palette, Sliders, PowerIcon } from 'lucide-react';
import {
  ColorPicker,
  ColorPickerSelection,
  ColorPickerEyeDropper,
  ColorPickerHue,
  ColorPickerAlpha,
  ColorPickerOutput,
  ColorPickerFormat,
} from '@/components/ui/color-picker';
import Color, { ColorLike } from 'color';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';

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
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleColorChange = useCallback((value: ColorLike) => {
    const colorObj = Color.rgb(value);
    const rgbaString = colorObj.rgb().string();

    setFillColor(rgbaString);
    setStrokeColor(rgbaString);
  }, [setFillColor, setStrokeColor]);

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
        <Button
          variant={showColorPicker ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Select Color"
          className={`w-10 h-10 ${!showColorPicker ? 'text-primary-foreground' : ''}`}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: fillColor,
              borderRadius: '50%',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
            }}
          />
        </Button>
      </div>

      <div className="pt-4 space-y-3">
        {showColorPicker && (
          <div className="my-2">
            <ColorPicker
              onChange={handleColorChange}
              className="max-w-sm rounded-md border p-4 shadow-sm h-[260px]"
            >
              <ColorPickerSelection />
              <div className="flex items-center gap-4">
                <ColorPickerEyeDropper />
                <div className="grid w-full gap-1">
                  <ColorPickerHue />
                  <ColorPickerAlpha />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ColorPickerOutput />
                <ColorPickerFormat />
              </div>
            </ColorPicker>
          </div>
        )}
        {tool === 'bucket' && !showColorPicker && (
          <div className="flex flex-col items-center space-y-2 pt-2">
            <label htmlFor="toolbarTolerance" className="flex items-center text-sm font-medium">
              <PowerIcon className="h-4 w-4" />
            </label>
            <Slider
              id="toolbarTolerance"
              min={0}
              max={255}
              value={[tolerance]}
              onValueChange={(value) => setTolerance(value[0])}
              className="h-32 w-6 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 data-[orientation=vertical]:min-h-10"
              orientation="vertical"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar; 