"use client";

import { Post, ImageMetadata } from "@lens-protocol/client";
import { Heart, MessageCircle, Repeat, GitFork } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { UserLayerData } from "@/lib/types";
import { toast } from "sonner";
import { createDraftDrawing } from "@/lib/drawing-utils";

interface PostInteractionsProps {
  post?: Post;
}

export default function PostInteractions({ post }: PostInteractionsProps) {
  const router = useRouter();
  const metadata = post?.metadata as ImageMetadata;

  const fileAttribute = metadata?.attributes?.find(
    (attr) => attr.key === 'file'
  );
  const canDerive = fileAttribute && typeof fileAttribute.value === 'string' && fileAttribute.value.trim() !== '';
  const authorDisplayName = post?.author.metadata?.name || post?.author.username?.localName || post?.author.address.substring(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 50 }}
      className="w-full"
    >
      {post && (
        <div className="flex flex-col space-y-3">
          <div className="flex justify-around items-center text-md text-muted-foreground py-2">
            <div className="flex items-center space-x-1.5 mx-4">
              <Heart size={20} />
              <span>{post.stats.upvotes}</span>
            </div>
            <div className="flex items-center space-x-1.5 mx-4">
              <Repeat size={20} />
              <span>{post.stats.reposts}</span>
            </div>
            <div className="flex items-center space-x-1.5 mx-4">
              <MessageCircle size={20} />
              <span>{post.stats.comments}</span>
            </div>
            {canDerive && (
              <div
                className="flex items-center space-x-1.5 mx-4 cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleDeriveClick()}
              >
                <GitFork size={20} />
                <span>Derive</span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );

  function handleDeriveClick() {
    if (!post || !metadata || !metadata.attributes) {
      toast.error("Post data is not available for derivation.");
      return;
    }

    if (!fileAttribute || typeof fileAttribute.value !== 'string') {
      toast.error("No derivable layer data found in this post.");
      return;
    }

    let layers: UserLayerData[];
    try {
      layers = JSON.parse(fileAttribute.value);
      if (!Array.isArray(layers) || layers.some(layer => typeof layer.id !== 'string')) {
        throw new Error("Parsed layer data is not valid.");
      }
    } catch (error) {
      console.error("Failed to parse layer data:", error);
      toast.error("Failed to parse layer data from post.");
      return;
    }

    const newDrawingId = createDraftDrawing(layers);

    if (newDrawingId) {
      router.push(`/draw/${newDrawingId}`);
      toast.success(`Derived ${authorDisplayName}'s drawing!`, { duration: 1000 });
    } else {
      toast.error("Failed to save derived drawing locally.");
    }
  }
} 