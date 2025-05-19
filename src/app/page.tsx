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
      <div className="flex-grow p-4 overflow-y-auto">
        <Feed />
      </div>

      <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col space-y-4">
        <div className="mb-auto">
          <UserMenu />
        </div>
        <DrawButton />
        <ThemeToggle />
      </div>
    </div>
  );
}
