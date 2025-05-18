import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getLensClient } from '@/lib/lens/client';
import { MetadataAttributeType, image, MediaImageMimeType, MetadataLicenseType, mainContentFocus } from "@lens-protocol/metadata";
import Konva from 'konva';
import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { useWalletClient } from 'wagmi';
import GlareCard from '../effects/glare-card';
import { storageClient } from '@/lib/lens/storage';
import { MainContentFocus } from '@lens-protocol/client';
import { post } from '@lens-protocol/client/actions';
import { handleOperationWith } from '@lens-protocol/client/viem';

const dataURLtoFile = (dataurl: string, filename: string): File | null => {
  const arr = dataurl.split(',');
  if (arr.length < 2) {
    return null;
  }
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || mimeMatch.length < 2) {
    return null;
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

interface PublishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  onPublish: (uri: string) => void;
}

const PublishDialog: React.FC<PublishDialogProps> = ({
  isOpen,
  onClose,
  stageRef,
  onPublish,
}) => {
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [drawingTitle, setDrawingTitle] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const { data: walletClient } = useWalletClient();

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

  const handlePublish = async () => {
    if (!imageDataUrl) {
      toast.error('No image data to publish');
      return;
    }

    if (!walletClient) {
      toast.error('Wallet not connected');
      return;
    }

    setIsPublishing(true);

    try {
      // Convert data URL to File
      const file = dataURLtoFile(imageDataUrl, drawingTitle || 'drawing.jpg');
      if (!file) {
        toast.error('Failed to convert image data to file');
        setIsPublishing(false);
        return;
      }

      // Get the session client
      const client = await getLensClient();
      if (!client || !client.isSessionClient) {
        toast.error('Failed to get lens client - you must be logged in');
        setIsPublishing(false);
        return;
      }

      // Upload the folder with the image and metadata
      toast.info('Uploading your drawing...');

      // Use uploadFile to simplify the process
      const { uri } = await storageClient.uploadFile(file);
      console.log('Uploaded image to grove storage:', uri);

      const metadata = image({
        title: drawingTitle || undefined,
        image: {
          item: uri,
          type: MediaImageMimeType.JPEG,
          altTag: drawingTitle || undefined,
          license: MetadataLicenseType.CCO,
        },
        tags: ['drawing', 'art'],
        attributes: [
          {
            type: MetadataAttributeType.STRING,
            key: 'Category',
            value: 'Art',
          },
        ],
      });

      const metadataFile = new File([JSON.stringify(metadata)], 'metadata.json', { type: 'application/json' });
      const { uri: contentUri } = await storageClient.uploadFile(metadataFile);

      toast.success('Drawing uploaded successfully!');
      console.log('Uploaded metadata to grove storage:', contentUri);

      toast.info('Creating post on Lens...');

      try {
        if (!client || !client.isSessionClient) {
          return
        }

        const result = await post(client as any, {
          contentUri,
        }).andThen(handleOperationWith(walletClient));

        if (result.isOk()) {
          const txHash = result.value;
          console.log('Post created successfully with tx hash:', txHash);

          toast.success('Drawing published to Lens!');
          onPublish(contentUri);
          onClose();
        } else {
          console.error('Failed to create post:', result.error);
          toast.error(`Failed to publish: ${String(result.error)}`);
        }
      } catch (error) {
        console.error('Error in post function:', error);
        toast.error(`Error in post function: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error publishing drawing:', error);
      toast.error(`Error publishing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPublishing(false);
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
              Title (optional)
            </label>
            <Input
              id="title"
              value={drawingTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDrawingTitle(e.target.value)}
              className="w-full"
              placeholder="My Awesome Drawing"
            />
          </div>
          <div className="flex justify-center items-center aspect-square">
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
          <Button
            type="button"
            onClick={handlePublish}
            className="w-full mt-4"
            disabled={isGenerating || !imageDataUrl || isPublishing || !walletClient}
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublishDialog;
