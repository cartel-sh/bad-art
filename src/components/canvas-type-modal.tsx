"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { PaintbrushIcon, Grid3x3Icon } from "lucide-react";

interface CanvasTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: "regular" | "pixel", gridSize?: number) => void;
}

export function CanvasTypeModal({ open, onClose, onSelect }: CanvasTypeModalProps) {
  const handleRegularCanvas = () => {
    onSelect("regular");
    onClose();
  };

  const handlePixelCanvas = () => {
    onSelect("pixel", 25);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-4 overflow-hidden">
        <div className="grid grid-cols-1 gap-3">
          <Button
            variant="ghost"
            className="h-32 rounded-lg border-0 flex flex-row items-center justify-start gap-6 p-6 hover:bg-accent"
            onClick={handleRegularCanvas}
          >
            <PaintbrushIcon className="size-10 flex-shrink-0" />
            <div className="text-left">
              <div className="text-xl font-semibold mb-1">Regular Canvas</div>
              <div className="text-base text-muted-foreground">
                Free drawing with smooth lines
              </div>
            </div>
          </Button>
          <Button
            variant="ghost"
            className="h-32 rounded-lg border-0 flex flex-row items-center justify-start gap-6 p-6 hover:bg-accent"
            onClick={handlePixelCanvas}
          >
            <Grid3x3Icon className="size-10 flex-shrink-0" />
            <div className="text-left">
              <div className="text-xl font-semibold mb-1">Pixel Art Canvas</div>
              <div className="text-base text-muted-foreground">
                Draw pixel-perfect art on a grid
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}