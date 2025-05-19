"use client";

import { Post, ImageMetadata } from "@lens-protocol/client";
import { Heart, MessageCircle, Repeat } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveUrl } from "@/lib/resolve-url";
import { motion } from "motion/react";

interface SidebarProps {
  post?: Post;
  metadata?: ImageMetadata;
}

const formatTimeAgo = (timestamp?: string): string => {
  if (!timestamp) return "";
  const now = new Date();
  const secondsPast = Math.floor((now.getTime() - new Date(timestamp).getTime()) / 1000);

  if (secondsPast < 0) {
    return "just now";
  }
  if (secondsPast < 10) {
    return "now";
  }
  if (secondsPast < 60) {
    return `${secondsPast}s`;
  }
  const minutesPast = Math.floor(secondsPast / 60);
  if (minutesPast < 60) {
    return `${minutesPast}m`;
  }
  const hoursPast = Math.floor(minutesPast / 60);
  if (hoursPast < 24) {
    return `${hoursPast}h`;
  }
  const daysPast = Math.floor(hoursPast / 24);
  return `${daysPast}d`;
};

export default function Sidebar({ post }: SidebarProps) {
  const metadata = post?.metadata as ImageMetadata;
  const authorPictureRaw = post?.author.metadata?.picture;
  const authorDisplayName = post?.author.metadata?.name || post?.author.username?.localName || post?.author.address.substring(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 50 }}
      className="w-96 flex-shrink-0 bg-background drop-shadow-lg drop-shadow-black/20 shadow-black/20 p-8 flex flex-col space-y-4 h-screen"
    >
      <div className="mb-auto space-y-4">
        {post && metadata && (
          <div className="pt-4">
            {post.author && (
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={resolveUrl(authorPictureRaw) || undefined} />
                    <AvatarFallback>{authorDisplayName?.substring(0, 2).toUpperCase() || "A"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{authorDisplayName}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatTimeAgo(post.timestamp)}
                </span>
              </div>
            )}

            {metadata.title && (
              <h2 className="text-2xl font-bold mb-3">{metadata.title}</h2>
            )}
            {metadata.content && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{metadata.content}</p>}

            <div className="mt-6 flex justify-around items-center text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1.5">
                <Heart size={20} />
                <span>{post.stats.upvotes}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Repeat size={20} />
                <span>{post.stats.reposts}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <MessageCircle size={20} />
                <span>{post.stats.comments}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
} 