"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resolveUrl } from "@/lib/resolve-url";
import { ImageMetadata, Post } from "@lens-protocol/client";
import { ExternalLink, MoreHorizontal, MoreVertical } from "lucide-react";
import { motion } from "motion/react";

interface AuthorInfoProps {
  post?: Post;
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

export default function AuthorInfo({ post }: AuthorInfoProps) {
  const metadata = post?.metadata as ImageMetadata;
  const authorPictureRaw = post?.author.metadata?.picture;
  const authorDisplayName =
    post?.author.metadata?.name || post?.author.username?.localName || post?.author.address.substring(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 50 }}
      className="w-full"
    >
      {post && metadata && (
        <div>
          {post.author && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={resolveUrl(authorPictureRaw) || undefined} />
                  <AvatarFallback>{authorDisplayName?.substring(0, 2).toUpperCase() || "A"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-md font-medium">{authorDisplayName}</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <span className="text-md text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatTimeAgo(post.timestamp)}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 ml-1">
                      <MoreHorizontal className="h-6 w-6" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-lg" align="end" side="top">
                    <DropdownMenuItem asChild>
                      <a
                        href={`https://hey.xyz/posts/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        <span>Open on hey</span>
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {metadata.title && <h2 className="text-2xl font-bold mb-2">{metadata.title}</h2>}
          {metadata.content && <p className="text-md text-gray-600 dark:text-gray-400">{metadata.content}</p>}
        </div>
      )}
    </motion.div>
  );
}
