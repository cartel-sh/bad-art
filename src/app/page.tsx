import { Login } from "@/components/login";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UserMenu from "@/components/user-menu";
import { DrawButton } from "@/components/draw-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SessionClient } from "@lens-protocol/client";
import { Feed } from "@/components/feed";

export default async function Home() {
  const { getLensClient } = await import("@/lib/lens/client");
  const { fetchAccount } = await import("@lens-protocol/client/actions");

  const client = await getLensClient();
  let isAuthenticated = false;
  let sessionClient: SessionClient | null = null;

  if (client.isSessionClient()) {
    const authenticatedUser = client.getAuthenticatedUser().unwrapOr(null);
    if (authenticatedUser) {
      isAuthenticated = true;
      sessionClient = client;
    }
  }

  if (!isAuthenticated || !sessionClient) {
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
    <div className="flex w-full h-screen">
      <div className="w-1/4 p-4 flex flex-col space-y-2">
        <DrawButton />
        <ThemeToggle />
      </div>

      <div className="flex-grow p-4">
        <Feed />
      </div>

      <div className="w-1/4 p-4 flex flex-col items-start h-full">
        <UserMenu />
      </div>
    </div>
  );
}
