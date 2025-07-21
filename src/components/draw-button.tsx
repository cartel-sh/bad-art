"use client";

import { Button } from "@/components/ui/button";
import { CanvasTypeModal } from "@/components/canvas-type-modal";
import { generateNewDrawingId } from "@/lib/drawing-utils";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DrawButtonProps {
  [key: `data-${string}`]: boolean;
}

export function DrawButton(props: DrawButtonProps = {}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleDrawClick = () => {
    setShowModal(true);
  };

  const handleCanvasTypeSelect = (type: "regular" | "pixel", gridSize?: number) => {
    const newDrawingId = generateNewDrawingId();
    const params = new URLSearchParams({
      type,
      ...(gridSize && { gridSize: gridSize.toString() }),
    });
    const url = `/draw/${newDrawingId}?${params.toString()}`;
    router.push(url);
  };

  return (
    <>
      <Button className="w-10 h-10" onClick={handleDrawClick} variant="secondary" size="default" {...props}>
        <PlusIcon strokeWidth={3} className="w-4 h-4" />
      </Button>
      <CanvasTypeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleCanvasTypeSelect}
      />
    </>
  );
}
