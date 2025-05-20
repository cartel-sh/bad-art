"use client";

import { Post, ImageMetadata } from "@lens-protocol/client";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GlareCard from "./effects/glare-card";
import { resolveUrl } from "@/lib/resolve-url";

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
      className="w-full z-[100] bg-background flex items-center justify-center relative h-full overflow-visible"
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
        className="w-[65%] h-auto flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <GlareCard imageUrl={resolvedUrl} altText={imageAlt} />
      </motion.div>
    </div>
  );
} 