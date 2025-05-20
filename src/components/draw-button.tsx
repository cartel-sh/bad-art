"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { generateNewDrawingId } from "@/lib/drawing-utils";

export function DrawButton() {
  const router = useRouter();

  const handleDrawClick = () => {
    const newDrawingId = generateNewDrawingId();
    const url = `/draw/${newDrawingId}`;
    router.push(url);
  };

  return (
    <Button className="w-10 h-10" onClick={handleDrawClick} variant="secondary" size="default">
      <PlusIcon strokeWidth={3} className="w-4 h-4" />
    </Button>
  );
} 