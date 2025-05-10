import { Login } from "@/components/login";
import { getLensClient } from "@/lib/lens/client";
import { fetchAccount } from "@lens-protocol/client/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function Home() {
  const account = await getAuthenticatedAccount();

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in with Lens</CardTitle>
            <CardDescription>Connect your wallet to access your Lens profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Login />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={account.metadata?.picture} />
            <AvatarFallback>{account.address.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{account.metadata?.name}</CardTitle>
            <CardDescription className="mt-1">
              {account.address}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
