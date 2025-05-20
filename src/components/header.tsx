"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { Noto_Sans, Open_Sans } from "next/font/google";
import Image from "next/image";

const geistSans = Noto_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function Header() {
  const pathname = usePathname();

  const isSketchPage = pathname?.includes('/sketches');
  const isDrawPage = pathname?.includes('/draw');

  const brandText = isSketchPage ? "MY/ART" : "BAD/ART";

  if (isDrawPage) {
    return null
  }

  return (
    <motion.header
      className="w-full z-40 h-[8vh] flex items-center justify-start px-4 py-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href="/" className="flex items-center gap-2">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex items-center"
        >
          <motion.span
            className={`text-4xl font-bold ml-2 italic  -tracking-[4px] ${geistSans.className} uppercase`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {brandText}
          </motion.span>
        </motion.div>
      </Link>
    </motion.header>
  );
} 