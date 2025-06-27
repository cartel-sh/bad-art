"use client";

import { DrawButton } from "@/components/draw-button";
import { Login } from "@/components/login";
import { Dock } from "@/components/ui/dock";
import UserMenu, { UserAvatar } from "@/components/user-menu";
import { useAccount } from "@/contexts/account-context";
import { useAuthenticatedUser } from "@lens-protocol/react";
import { BrushIcon, HomeIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DockMenu() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { account, loading } = useAccount();
  const { data: user } = useAuthenticatedUser();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const isAuthenticated = !loading && user && account;

  const dockItems = [
    {
      icon: HomeIcon,
      label: "Home",
      onClick: () => router.push("/"),
    },
    {
      icon: theme === "light" ? MoonIcon : SunIcon,
      label: "Toggle theme",
      onClick: toggleTheme,
    },
    ...(isAuthenticated
      ? [
          {
            customIcon: <UserAvatar />,
            label: "Profile",
            extra: <UserMenu variant="buttons" />,
          },
          {
            icon: BrushIcon,
            label: "Draw",
            onClick: () => {
              const drawButton = document.querySelector("[data-draw-button]");
              if (drawButton) {
                (drawButton as HTMLButtonElement).click();
              }
            },
            variant: "primary" as const,
          },
        ]
      : [
          {
            customComponent: <Login />,
            label: "Login",
          },
        ]),
  ];

  return (
    <>
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-50 hidden sm:block">
        <Dock items={dockItems} />
      </div>
      <div className="fixed bottom-0 left-0 w-full z-50 sm:hidden p-2">
        <Dock items={dockItems} />
      </div>
      <div className="hidden">
        <DrawButton data-draw-button />
      </div>
    </>
  );
}
