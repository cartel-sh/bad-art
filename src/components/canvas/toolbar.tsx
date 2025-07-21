"use client";

import { Button } from "@/components/ui/button";
import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
} from "@/components/ui/color-picker";
import { CanvasType } from "@/lib/types";
import Color, { ColorLike } from "color";
import { Eraser, PaintBucket, Palette, Pencil, PowerIcon, Sliders } from "lucide-react";
import React, { useState, useCallback, useEffect } from "react";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";
import { Label } from "../ui/label";

export type Tool = "pen" | "eraser" | "bucket";

interface ToolbarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  setStrokeColor: (color: string) => void;
  tolerance: number;
  setTolerance: (tolerance: number) => void;
  canvasType?: CanvasType;
  strokeWidth?: number;
  setStrokeWidth?: (width: number) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  fillColor,
  setFillColor,
  setStrokeColor,
  tolerance,
  setTolerance,
  canvasType = "regular",
  strokeWidth = 5,
  setStrokeWidth,
}) => {
  const [showColorPickerPopup, setShowColorPickerPopup] = useState(false);
  const [color, setColor] = useState(fillColor);

  const handleColorChange = useCallback(
    (value: ColorLike) => {
      const colorObj = Color.rgb(value);
      const rgbaString = colorObj.rgb().string();

      setFillColor(rgbaString);
      setStrokeColor(rgbaString);
    },
    [setFillColor, setStrokeColor],
  );

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea, etc.
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "b": // Photoshop brush tool shortcut
          setTool("pen");
          break;
        case "e": // Photoshop eraser tool shortcut
          setTool("eraser");
          break;
        case "g": // Photoshop fill/paint bucket tool shortcut
          setTool("bucket");
          break;
        case "i": // Photoshop eyedropper/color picker shortcut
          setShowColorPickerPopup((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setTool]);

  return (
    <div className="p-1 bg-secondary shadow-lg rounded-lg border border-border flex flex-col gap-2 relative">
      <div className="flex flex-col gap-1 items-center rounded-md">
        <Button
          variant={tool === "pen" ? "outline" : "secondary"}
          size="icon"
          onClick={() => setTool("pen")}
          title="Pen (B)"
          className="w-10 h-10 hover:bg-background"
        >
          <Pencil className="h-5 w-5" />
        </Button>
        <Button
          variant={tool === "eraser" ? "outline" : "secondary"}
          size="icon"
          onClick={() => setTool("eraser")}
          title="Eraser (E)"
          className="w-10 h-10 hover:bg-background"
        >
          <Eraser className="h-5 w-5" />
        </Button>
        {canvasType === "regular" && (
          <Button
            variant={tool === "bucket" ? "outline" : "secondary"}
            size="icon"
            onClick={() => setTool("bucket")}
            title="Bucket (G)"
            className="w-10 h-10 hover:bg-background"
          >
            <PaintBucket className="h-5 w-5" />
          </Button>
        )}
        <Button
          variant={showColorPickerPopup ? "outline" : "secondary"}
          size="icon"
          onClick={() => setShowColorPickerPopup(!showColorPickerPopup)}
          title="Select Color (I)"
          className="w-10 h-10 hover:bg-background"
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: fillColor,
              borderRadius: "40%",
              border: "1px solid hsl(var(--border))",
            }}
          />
        </Button>
      </div>

      {canvasType === "regular" && tool === "pen" && setStrokeWidth && (
        <div className="px-2 py-1">
          <Label htmlFor="stroke-width" className="text-xs text-muted-foreground">
            Stroke
          </Label>
          <Slider
            id="stroke-width"
            min={1}
            max={20}
            step={1}
            value={[strokeWidth]}
            onValueChange={(value) => setStrokeWidth(value[0])}
            className="w-full"
          />
          <div className="text-xs text-center text-muted-foreground mt-1">
            {strokeWidth}px
          </div>
        </div>
      )}

      {showColorPickerPopup && (
        <ColorPicker
          value={color}
          onChange={handleColorChange}
          className="absolute top-56 left-46 z-10 flex flex-col items-center justify-center gap-2 rounded-md"
        >
          <div
            className="w-[300px] z-10 transition-all duration-300 ease-in-out transform scale-0 opacity-0 data-[open=true]:scale-100 data-[open=true]:opacity-100 my-2"
            data-open={showColorPickerPopup}
          >
            <div className="rounded-md border bg-card/20 p-1 shadow-lg flex flex-col gap-4">
              <ColorPickerSelection className="aspect-square w-full" />

              <div className="flex flex-col gap-4 w-full px-2">
                <ColorPickerHue className="w-full h-4" />
                <ColorPickerAlpha className="w-full h-4" />
              </div>

              {/* <div className="flex items-center gap-2">
                <ColorPickerOutput />
                <ColorPickerFormat />
              </div> */}
            </div>
          </div>
        </ColorPicker>
      )}
    </div>
  );
};

export default Toolbar;
