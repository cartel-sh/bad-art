"use client";

import Link from "next/link";
import { HomeIcon } from "lucide-react"; // Assuming lucide-react is used for icons
import { DrawButton } from "@/components/draw-button";
import UserMenu from "@/components/user-menu";
import { buttonVariants } from "@/components/ui/button"; // For styling consistency
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

export default function GlobalMenu() {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-6 sm:gap-8">
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "w-10 h-10")}
        aria-label="Home"
      >
        <HomeIcon className="h-8 w-8" strokeWidth={3} />
      </Link>
      <ThemeToggle />
      <UserMenu />
      <DrawButton />
    </div>
  );
} 