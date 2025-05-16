"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Eraser, PaintBucket, Palette, Sliders, PowerIcon } from 'lucide-react';
import {
  ColorPicker,
  ColorPickerSelection,
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
  const [showColorPickerPopup, setShowColorPickerPopup] = useState(false);
  const [color, setColor] = useState(fillColor);

  const handleColorChange = useCallback((value: ColorLike) => {
    const colorObj = Color.rgb(value);
    const rgbaString = colorObj.rgb().string();

    setFillColor(rgbaString);
    setStrokeColor(rgbaString);
  }, [setFillColor, setStrokeColor]);

  return (
    <div className="p-1 bg-secondary shadow-lg rounded-lg border border-border flex flex-col gap-2 relative">
      <div className="flex flex-col gap-1 items-center rounded-md">
        <Button
          variant={tool === 'pen' ? 'outline' : 'secondary'}
          size="icon"
          onClick={() => setTool('pen')}
          title="Pen"
          className="w-10 h-10 hover:bg-background"
        >
          <Pencil className="h-5 w-5" />
        </Button>
        <Button
          variant={tool === 'eraser' ? 'outline' : 'secondary'}
          size="icon"
          onClick={() => setTool('eraser')}
          title="Eraser"
          className="w-10 h-10 hover:bg-background"
        >
          <Eraser className="h-5 w-5" />
        </Button>
        <Button
          variant={tool === 'bucket' ? 'outline' : 'secondary'}
          size="icon"
          onClick={() => setTool('bucket')}
          title="Bucket"
          className="w-10 h-10 hover:bg-background"
        >
          <PaintBucket className="h-5 w-5" />
        </Button>
        <Button
          variant={showColorPickerPopup ? 'outline' : 'secondary'}
          size="icon"
          onClick={() => setShowColorPickerPopup(!showColorPickerPopup)}
          title="Select Color"
          className="w-10 h-10 hover:bg-background"
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: fillColor,
              borderRadius: '40%',
              border: '1px solid hsl(var(--border))',
            }}
          />
        </Button>
      </div>

      {/* {tool === 'bucket' && (
        <div className="px-2 absolute top-25 left-14 flex items-center space-x-2 p-1 rounded-md bg-background/20">
          <label htmlFor="toolbarTolerance" className="flex items-center text-muted-foreground text-sm font-medium" title="Tolerance">
            Tolerance
          </label>
          <Slider
            id="toolbarTolerance"
            min={0}
            max={255}
            value={[tolerance]}
            onValueChange={(value) => setTolerance(value[0])}
            className="w-40 h-6"
            orientation="horizontal"
          />
        </div>
      )} */}

      <ColorPicker
        value={color}
        onChange={handleColorChange}
        className="flex flex-col items-center justify-center gap-2 p-1 rounded-md">

        <div className="flex flex-col items-center justify-center h-32">
          <ColorPickerHue orientation="vertical" className="w-6 h-full flex items-center justify-center" />
        </div>
        <div className="flex flex-col items-center justify-center h-32">
          <ColorPickerAlpha orientation="vertical" className="w-6 h-full flex items-center justify-center" />
        </div>

        {showColorPickerPopup && (
          <div
            className="absolute aspect-square h-[280px] top-0 left-16 z-10 transition-all duration-300 ease-in-out transform scale-0 opacity-0 data-[open=true]:scale-100 data-[open=true]:opacity-100 my-2"
            data-open={showColorPickerPopup}
          >
            <div
              className="max-w-sm rounded-md border bg-card/20 p-1 shadow-lg"
            >
              <ColorPickerSelection className="aspect-square w-full" />
              <div className="flex items-center gap-2">
                <ColorPickerOutput />
                <ColorPickerFormat />
              </div>
            </div>
          </div>
        )}
      </ColorPicker>
    </div>
  );
};

export default Toolbar; 