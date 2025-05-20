import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getLensClient } from '@/lib/lens/client';
import { MetadataAttributeType, image, MediaImageMimeType, MetadataLicenseType, mainContentFocus } from "@lens-protocol/metadata";
import Konva from 'konva';
import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { useWalletClient } from 'wagmi';
import GlareCard, { ShineEffect } from '../effects/glare-card';
import { storageClient } from '@/lib/lens/storage';
import { MainContentFocus, SessionClient } from '@lens-protocol/client';
import { fetchPost, post } from '@lens-protocol/client/actions';
import { handleOperationWith } from '@lens-protocol/client/viem';
import { ConnectKitButton } from 'connectkit';
import { useRouter } from 'next/navigation';
import { UserLayerData } from '@/lib/types';

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
  layers: UserLayerData[];
}

const PublishDialog: React.FC<PublishDialogProps> = ({
  isOpen,
  onClose,
  stageRef,
  onPublish,
  layers,
}) => {
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [drawingTitle, setDrawingTitle] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const { data: walletClient } = useWalletClient();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && stageRef.current) {
      setIsGenerating(true);
      const dataUrl = stageRef.current.toDataURL({ mimeType: 'image/png' });
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

    const toastId = toast.loading('Starting publication process...');

    try {
      const file = dataURLtoFile(imageDataUrl, drawingTitle || 'drawing.png');
      if (!file) {
        toast.error('Failed to convert image data to file', { id: toastId });
        setIsPublishing(false);
        return;
      }

      const client = await getLensClient();
      if (!client || !client.isSessionClient) {
        toast.error('Failed to get lens client - you must be logged in', { id: toastId });
        setIsPublishing(false);
        return;
      }

      toast.loading('Uploading your drawing...', { id: toastId });

      const { uri } = await storageClient.uploadFile(file);
      console.log('Uploaded image to grove storage:', uri);

      const metadata = image({
        title: drawingTitle || undefined,
        image: {
          item: uri,
          type: MediaImageMimeType.PNG,
          altTag: drawingTitle || undefined,
          license: MetadataLicenseType.CCO,
        },
        tags: ['drawing', 'art'],
        attributes: [
          {
            type: MetadataAttributeType.STRING,
            key: 'category',
            value: 'Art',
          },
          {
            type: MetadataAttributeType.JSON,
            key: 'file',
            value: JSON.stringify(layers),
          },
        ],
      });

      const metadataFile = new File([JSON.stringify(metadata)], 'metadata.json', { type: 'application/json' });
      const { uri: contentUri } = await storageClient.uploadFile(metadataFile);

      toast.loading('Creating post on Lens...', { id: toastId });
      console.log('Uploaded metadata to grove storage:', contentUri);

      try {
        if (!client || !client.isSessionClient()) {
          return
        }

        const result = await post(client as any, {
          contentUri,
        })
          .andThen(handleOperationWith(walletClient))
          .andThen((client).waitForTransaction)
          .andThen((txHash) => fetchPost(client, { txHash }))

        if (result.isOk()) {
          console.log('Post created successfully with tx hash:', result.value);

          toast.success('Drawing published successfully!', { id: toastId });

          onPublish(result.value?.slug || '');

          router.push(`/p/${result.value?.slug}`);
          onClose();

        } else {
          console.error('Failed to create post:', result.error);
          toast.error(`Failed to publish: ${String(result.error)}`, { id: toastId });
        }
      } catch (error) {
        console.error('Error in post function:', error);
        toast.error(`Error in post function: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
      }
    } catch (error) {
      console.error('Error publishing drawing:', error);
      toast.error(`Error publishing: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
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
                shineEffect={ShineEffect.None}
              />
            )}
            {!isGenerating && !imageDataUrl && <p>No preview available.</p>}
          </div>
        </div>
        <DialogFooter>
          {!walletClient && <ConnectKitButton.Custom >
            {({ show }) => (
              <Button
                type="button"
                onClick={show}
                className="w-full mt-4"
              >
                Connect Wallet
              </Button>
            )}
          </ConnectKitButton.Custom>}
          {walletClient && <Button
            type="button"
            onClick={handlePublish}
            className="w-full mt-4"
            disabled={isGenerating || !imageDataUrl || isPublishing}
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublishDialog;
