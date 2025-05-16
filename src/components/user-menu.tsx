import { getLensClient } from "@/lib/lens/client";
import { fetchAccount } from "@lens-protocol/client/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

async function getAuthenticatedAccount() {
  const client = await getLensClient();

  if (!client.isSessionClient()) {
    return null;
  }

  const authenticatedUser = client.getAuthenticatedUser().unwrapOr(null);
  if (!authenticatedUser) {
    return null;
  }

  return fetchAccount(client, { address: authenticatedUser.address }).unwrapOr(null);
}

export default async function UserMenu() {
  const account = await getAuthenticatedAccount();

  if (!account) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-10 w-10">
        <AvatarImage src={account.metadata?.picture} />
        <AvatarFallback>{account.address.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium">{account.metadata?.name || account.username?.localName || account.address.substring(0, 6)}</p>
      </div>
    </div>
  );
} 