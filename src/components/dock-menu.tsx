"use client";

import { DrawButton } from "@/components/draw-button";
import { Login } from "@/components/login";
import { Dock } from "@/components/ui/dock";
import UserMenu, { UserAvatar } from "@/components/user-menu";
import { useAccount } from "@/contexts/account-context";
import { useAuthenticatedUser } from "@lens-protocol/react";
import { BrushIcon, Compass, HomeIcon, LogInIcon, MoonIcon, Palette, PlusIcon, SunIcon, Users } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function DockMenu() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { account, loading } = useAccount();
  const { data: user } = useAuthenticatedUser();
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const isAuthenticated = !loading && user && account;

  const dockItems = isAuthenticated
    ? [
        {
          icon:
            pathname === "/"
              ? HomeIcon
              : pathname === "/sketches"
                ? Palette
                : HomeIcon,
          label: "Home",
          onClick: () => router.push("/"),
          isActive: pathname === "/" || pathname === "/sketches",
          extra: (
            <div className="flex flex-col w-48 p-1">
              <button
                type="button"
                className="relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground w-full text-left"
                onClick={() => router.push("/")}
              >
                <HomeIcon size={16} />
                <span className="ml-3">Home</span>
              </button>
              <button
                type="button"
                className="relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground w-full text-left"
                onClick={() => router.push("/sketches")}
              >
                <Palette size={16} />
                <span className="ml-3">Sketches</span>
              </button>
            </div>
          ),
        },
        {
          icon: theme === "light" ? MoonIcon : SunIcon,
          label: "Toggle theme",
          onClick: toggleTheme,
        },
        {
          icon: PlusIcon,
          label: "Draw",
          onClick: () => {
            const drawButton = document.querySelector("[data-draw-button]");
            if (drawButton) {
              (drawButton as HTMLButtonElement).click();
            }
          },
          variant: "secondary" as const,
        },
        {
          customIcon: <UserAvatar />,
          onClick: () => router.push(`/sketches`),
          label: "Profile",
          extra: <UserMenu variant="buttons" />,
          isActive: pathname.startsWith("/u/"),
        },
      ]
    : [
        {
          icon:
            pathname === "/"
              ? HomeIcon
              : pathname === "/sketches"
                ? Palette
                : HomeIcon,
          label: "Home",
          onClick: () => router.push("/"),
          isActive: pathname === "/" || pathname === "/sketches",
          extra: (
            <div className="flex flex-col w-48 p-1">
              <button
                type="button"
                className="relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground w-full text-left"
                onClick={() => router.push("/")}
              >
                <HomeIcon size={16} />
                <span className="ml-3">Home</span>
              </button>
              <button
                type="button"
                className="relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground w-full text-left"
                onClick={() => router.push("/sketches")}
              >
                <Palette size={16} />
                <span className="ml-3">Sketches</span>
              </button>
            </div>
          ),
        },
        {
          icon: LogInIcon,
          label: "Log in",
          onClick: () => {
            const loginElement = document.querySelector("[data-login-button]");
            if (loginElement) {
              (loginElement as HTMLButtonElement).click();
            }
          },
          isActive: false,
        },
      ];

  return (
    <>
      <div className="fixed backdrop-blur-xl sm:backdrop-blur-none bottom-0 left-0 w-full sm:bottom-auto sm:top-1/2 sm:right-2 sm:left-auto sm:w-auto sm:-translate-y-1/2 z-50">
        <div className="absolute inset-0 bg-gradient-to-t from-secondary to-transparent pointer-events-none sm:hidden" />
        <div className="relative ">
          <Dock items={dockItems} />
        </div>
      </div>

      <div className="hidden">
        <DrawButton data-draw-button />
        <Login data-login-button />
      </div>
    </>
  );
}
