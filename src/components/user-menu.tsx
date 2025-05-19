"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAccount } from "@/contexts/account-context";
import { resolveUrl } from "@/lib/resolve-url";

export default function UserMenu() {
  const { account, loading } = useAccount();

  if (loading) {
    return <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (!account) {
    return null;
  }

  const pictureUrl = resolveUrl(account.metadata?.picture)
  const displayName = account.metadata?.name || account.username?.localName || account.address.substring(0, 6);

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-10 w-10">
        <AvatarImage src={pictureUrl || undefined} />
        <AvatarFallback>{account.address.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium">{displayName}</p>
      </div>
    </div>
  );
} 