"use client";

import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { useAuthenticatedUser } from "@lens-protocol/react";
import { ConnectKitButton } from "connectkit";
import { Loader2Icon, LogInIcon, User2Icon } from "lucide-react";
import { useState } from "react";
import { AccountSelector } from "./accounts";

interface LoginProps {
  [key: `data-${string}`]: boolean;
}

export function Login(props: LoginProps = {}) {
  const [showAccountSelector, setShowAccountSelector] = useState(true);
  const { data: authenticatedUser, loading: authUserLoading } = useAuthenticatedUser();

  return (
    <div className="">
      <ConnectKitButton.Custom>
        {({ isConnected: isWalletConnected, show, truncatedAddress, ensName, chain }) => {
          if (!isWalletConnected) {
            return (
              <Button onClick={show} variant="ghost" className="w-full" {...props}>
                <LogInIcon className="w-4 h-4 " strokeWidth={3} />
              </Button>
            );
          }

          if (isWalletConnected && !authenticatedUser) {
            return (
              <AccountSelector
                open={showAccountSelector}
                onOpenChange={setShowAccountSelector}
                trigger={
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full">
                      <User2Icon className="w-4 h-4 " strokeWidth={3} />
                    </Button>
                  </DialogTrigger>
                }
              />
            );
          }

          if (isWalletConnected && authenticatedUser) {
            return null;
          }

          return (
            <p className="text-xs text-muted-foreground">
              <Loader2Icon className="w-4 h-4 animate-spin" />
            </p>
          );
        }}
      </ConnectKitButton.Custom>
    </div>
  );
}
