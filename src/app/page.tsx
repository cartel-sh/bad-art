import { Login } from "@/components/login";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DrawButton } from "@/components/draw-button";
import { SessionClient } from "@lens-protocol/client";
import { Feed } from "@/components/feed";
import Sidebar from "@/components/sidebar";
import { getLensClient } from "@/lib/lens/client";

export default async function Home() {

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

      <Sidebar>
        <DrawButton />
      </Sidebar>
    </div>
  );
}
