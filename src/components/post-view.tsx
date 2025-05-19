"use client";

import { Post, ImageMetadata } from "@lens-protocol/client";
import { motion } from "motion/react";
import { resolveUrl } from "@/lib/resolve-url";

interface PostViewProps {
  post: Post;
  imageMetadata: ImageMetadata;
  resolvedUrl: string | undefined;
  imageAlt: string;
}

export default function PostView({ post, imageMetadata, resolvedUrl, imageAlt }: PostViewProps) {
  return (
    <div className="flex h-screen">
      <div className="w-4/5 bg-black flex items-center justify-center">
        {resolvedUrl ? (
          <motion.img
            layoutId={`image-${post.id}`}
            src={resolvedUrl}
            alt={imageAlt}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <p className="text-white">Image not available.</p>
        )}
      </div>
      <div className="w-1/5 bg-gray-100 dark:bg-gray-900 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{imageMetadata.title || "Untitled Image"}</h2>
        {imageMetadata.content && <p className="text-gray-700 dark:text-gray-300 mb-4">{imageMetadata.content}</p>}

        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-2">Details</h3>
          <p className="text-sm"><strong>Author:</strong> {post.author.username?.localName}</p>
          <p className="text-sm"><strong>Posted:</strong> {new Date(post.timestamp).toLocaleDateString()}</p>
          {post.id && <p className="text-sm"><strong>Post ID:</strong> {post.id}</p>}
        </div>
      </div>
    </div>
  );
} 