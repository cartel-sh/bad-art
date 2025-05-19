"use client";

import { Post, ImageMetadata } from "@lens-protocol/client";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PostViewProps {
  post: Post;
  imageMetadata: ImageMetadata;
  resolvedUrl: string | undefined;
  imageAlt: string;
}

export default function PostView({ post, imageMetadata, resolvedUrl, imageAlt }: PostViewProps) {
  const router = useRouter();

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      router.push("/?from=postview");
    }
  };

  return (
    <div
      className="w-full bg-background flex items-center justify-center relative h-screen"
      onClick={handleBackdropClick}
    >
      <Link href="/?from=postview" passHref>
        <motion.button
          className="absolute top-4 left-4 z-10 p-2 rounded-sm"
          aria-label="Go back to feed"
        >
          <ArrowLeft size={18} />
        </motion.button>
      </Link>
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
  );
} 