"use client";

import { Button } from "@/components/ui/button";
import { Redo, Undo } from "lucide-react";
import React from "react";

interface HistoryControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const HistoryControls: React.FC<HistoryControlsProps> = ({ onUndo, onRedo, canUndo, canRedo }) => {
  return (
    <div className="bg-secondary rounded-md p-1 shadow-lg rounded-lg border border-border flex gap-1">
      <Button
        variant="secondary"
        size="icon"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className={`w-10 h-10 hover:bg-background`}
      >
        <Undo className="h-5 w-5" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z or Ctrl+Y)"
        className={`w-10 h-10 hover:bg-background`}
      >
        <Redo className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default HistoryControls;
