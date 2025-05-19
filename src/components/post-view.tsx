"use client";

import { Post, ImageMetadata } from "@lens-protocol/client";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GlareCard from "./effects/glare-card";

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

  if (!resolvedUrl) {
    return <div>Image not available.</div>;
  }

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
      <motion.div
        layoutId={`${post.id}`}
        className="w-96 h-96 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <GlareCard imageUrl={resolvedUrl} altText={imageAlt} />
      </motion.div>
    </div>
  );
} 