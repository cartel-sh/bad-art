import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Konva from 'konva';
import { toast } from 'sonner';
import GlareCard from '../effects/glare-card';

interface PublishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  drawingTitle: string;
  onDrawingTitleChange: (title: string) => void;
  onPublish: (title: string, imageDataUrl: string) => void;
}

const PublishDialog: React.FC<PublishDialogProps> = ({
  isOpen,
  onClose,
  stageRef,
  drawingTitle,
  onDrawingTitleChange,
  onPublish,
}) => {
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && stageRef.current) {
      setIsGenerating(true);
      const dataUrl = stageRef.current.toDataURL({ mimeType: 'image/jpeg' });
      setImageDataUrl(dataUrl);
      setIsGenerating(false);
    } else {
      setImageDataUrl('');
    }
  }, [isOpen, stageRef]);

  const handlePublish = () => {
    if (imageDataUrl) {
      onPublish(drawingTitle, imageDataUrl);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Publish Drawing</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="text-sm text-muted-foreground">
              Title
            </label>
            <Input
              id="title"
              value={drawingTitle}
              onChange={(e) => onDrawingTitleChange(e.target.value)}
              className="w-full"
              placeholder="My Awesome Drawing"
            />
          </div>
          <div className="flex justify-center items-center border rounded-md aspect-square overflow-hidden bg-gray-100">
            {isGenerating && <p>Generating preview...</p>}
            {!isGenerating && imageDataUrl && (
              <GlareCard
                imageUrl={imageDataUrl}
                altText="Drawing Preview"
              />
            )}
            {!isGenerating && !imageDataUrl && <p>No preview available.</p>}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handlePublish} className="w-full mt-4" disabled={isGenerating || !imageDataUrl}>
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublishDialog; 