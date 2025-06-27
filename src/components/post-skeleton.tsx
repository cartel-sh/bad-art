"use client";

import { motion } from "motion/react";

export function SkeletonCard() {
  return (
    <motion.div
      className="bg-muted rounded-lg overflow-hidden shadow-xl aspect-[1/1]"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
    >
      <div className="w-full h-full" />
    </motion.div>
  );
}
