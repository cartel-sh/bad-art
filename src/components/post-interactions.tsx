"use client";

import { Post, ImageMetadata, PostReactionType } from "@lens-protocol/client";
import { Heart, MessageCircle, Repeat, GitFork } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { UserLayerData } from "@/lib/types";
import { toast } from "sonner";
import { createDraftDrawing } from "@/lib/drawing-utils";
import { useCallback, useState, useEffect } from "react";
import { getLensClient } from "@/lib/lens/client";
import { addReaction, undoReaction, repost } from "@lens-protocol/client/actions";

interface PostInteractionsProps {
  post?: Post;
  operations?: {
    hasUpvoted?: boolean;
    hasReposted?: boolean;
  };
}

export default function PostInteractions({
  post,
  operations = {},
}: PostInteractionsProps) {
  const router = useRouter();
  const metadata = post?.metadata as ImageMetadata;
  const stats = post?.stats || { upvotes: 0, reposts: 0, comments: 0 };
  const canRepost = post?.operations?.canRepost?.__typename === "PostOperationValidationPassed";

  const fileAttribute = metadata?.attributes?.find(
    (attr) => attr.key === 'file'
  );
  const canDerive = fileAttribute && typeof fileAttribute.value === 'string' && fileAttribute.value.trim() !== '';
  const authorDisplayName = post?.author.metadata?.name || post?.author.username?.localName || post?.author.address?.substring(0, 6);

  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(operations?.hasUpvoted || false);
  const [likeCount, setLikeCount] = useState(stats.upvotes);
  const [isReposting, setIsReposting] = useState(false);
  const [isReposted, setIsReposted] = useState(operations?.hasReposted || false);
  const [repostCount, setRepostCount] = useState(stats.reposts);

  // Update local state when props change
  useEffect(() => {
    setIsLiked(operations?.hasUpvoted || false);
    setLikeCount(stats.upvotes);
    setIsReposted(operations?.hasReposted || false);
    setRepostCount(stats.reposts);
  }, [operations?.hasUpvoted, stats.upvotes, operations?.hasReposted, stats.reposts]);

  const handleLike = useCallback(async () => {
    if (!post) {
      toast.error("Post data is not available for interaction.");
      return;
    }

    setIsLiking(true);
    const lens = await getLensClient();
    if (!lens.isSessionClient()) return null;

    const currentlyLiked = isLiked;
    const currentCount = likeCount;

    // Optimistically update UI with local state
    setIsLiked(!currentlyLiked);
    setLikeCount(currentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1);

    try {
      if (currentlyLiked) {
        await undoReaction(lens, { post: post.id, reaction: PostReactionType.Upvote });
      } else {
        await addReaction(lens, { post: post.id, reaction: PostReactionType.Upvote });
      }
    } catch (error) {
      console.error("Failed to handle like:", error);
      // Revert optimistic updates on error
      setIsLiked(currentlyLiked);
      setLikeCount(currentCount);
    } finally {
      setIsLiking(false);
    }
  }, [post, isLiked, likeCount]);

  const handleRepost = useCallback(async () => {
    if (!post || !post.operations) {
      toast.error("Post data or operations are not available for interaction.");
      return;
    }

    switch (post.operations.canRepost.__typename) {
      case "PostOperationValidationFailed":
        toast.error(`Reposting not allowed: ${post.operations.canRepost.reason}`);
        return;
      case "PostOperationValidationUnknown":
        toast.error("Reposting not allowed: Validation outcome is unknown.");
        return;
      case "PostOperationValidationPassed":
        // Reposting is allowed
        break;
      default:
        toast.error("Could not determine if reposting is allowed.");
        return;
    }

    setIsReposting(true);
    const lens = await getLensClient();
    if (!lens.isSessionClient()) {
      toast.error("You must be logged in to repost.");
      setIsReposting(false);
      return;
    }

    const currentlyReposted = isReposted;
    const currentCount = repostCount;

    // Optimistically update UI
    // Note: Lens protocol does not seem to have an "unrepost" or "undo repost" via API like it does for likes.
    // So, we only allow going from not-reposted to reposted.
    if (!currentlyReposted) {
      setIsReposted(true);
      setRepostCount(currentCount + 1);
    } else {
      // If already reposted, perhaps we just do nothing or inform the user?
      // For now, let's prevent multiple reposts and not change state if already reposted.
      toast.info("You have already reposted this.");
      setIsReposting(false);
      return;
    }

    try {
      const result = await repost(lens, { post: post.id });
      if (result.isErr()) {
        console.error("Failed to repost:", result.error);
        toast.error(`Failed to repost: ${result.error.message}`);
        // Revert optimistic updates on error
        setIsReposted(currentlyReposted);
        setRepostCount(currentCount);
      }
      // Success is handled by optimistic update. Potentially a toast.success here if desired.
    } catch (error) {
      console.error("Failed to handle repost:", error);
      toast.error("An unexpected error occurred while reposting.");
      // Revert optimistic updates on error
      setIsReposted(currentlyReposted);
      setRepostCount(currentCount);
    } finally {
      setIsReposting(false);
    }
  }, [post, isReposted, repostCount]);

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
            <div
              className={`flex items-center space-x-1.5 mx-4 cursor-pointer ${isLiked || isLiking ? 'text-red-500' : 'hover:text-red-500'} transition-colors`}
              onClick={handleLike}
            >
              <Heart
                size={20}
                fill={isLiked || isLiking ? 'currentColor' : 'none'}
                className={isLiked || isLiking ? 'opacity-50' : ''}
              />
              <span>{likeCount}</span>
            </div>
            <div
              className={`flex items-center space-x-1.5 mx-4 cursor-pointer ${isReposted || isReposting ? 'text-green-500' : 'hover:text-green-500'} transition-colors ${!canRepost && !isReposted ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={!isReposting && canRepost ? handleRepost : () => {
                if (!canRepost && !isReposted) {
                  toast.error(post?.operations?.canRepost?.__typename === 'PostOperationValidationFailed' ? `Reposting not allowed: ${post.operations.canRepost.reason}` : "Reposting not allowed.")
                }
              }}
            >
              <Repeat
                size={20}
                className={`${isReposted || isReposting ? 'opacity-50' : ''} ${!canRepost && !isReposted ? 'cursor-not-allowed' : ''}`}
              />
              <span>{repostCount}</span>
            </div>
            {/* <div className="flex items-center space-x-1.5 mx-4">
              <MessageCircle size={20} />
              <span>{stats.comments}</span>
            </div> */}
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