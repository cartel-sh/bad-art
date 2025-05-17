import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Konva from 'konva';
import { toast } from 'sonner';

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
  const imageRef = useRef<HTMLImageElement>(null);

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

  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      const handleLoad = () => {
        console.log('Image loaded, dimensions:', img.naturalWidth, img.naturalHeight);
      };
      const handleError = () => {
        toast.error('Failed to load image preview.', {duration: 500, position: "top-center"});
        console.error('Failed to load image preview.');
      };

      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleError);

      return () => {
        img.removeEventListener('load', handleLoad);
        img.removeEventListener('error', handleError);
      };
    }
  }, [imageDataUrl]);

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
              <img
                ref={imageRef}
                src={imageDataUrl}
                alt="Drawing Preview"
                className="max-w-full max-h-full object-contain"
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