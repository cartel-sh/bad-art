"use client";

import { Post, ImageMetadata } from "@lens-protocol/client";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { XIcon } from "lucide-react";
import GlareCard from "./effects/glare-card";
import { resolveUrl } from "@/lib/resolve-url";
import { Button } from "./ui/button";

export default function PostView({ post }: { post: Post }) {
  const router = useRouter();
  const metadata = post.metadata as ImageMetadata;
  const imageUrl = metadata.image?.item;
  const resolvedUrl = imageUrl ? resolveUrl(imageUrl) : undefined;
  const imageAlt = metadata.image?.altTag ?? "Post image";

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
      className="w-full flex items-center justify-center relative"
      onClick={handleBackdropClick}
    >
      <motion.div
        layoutId={`${post.id}`}
        className="w-full"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <GlareCard imageUrl={resolvedUrl} altText={imageAlt} />
      </motion.div>
    </div>
  );
} 