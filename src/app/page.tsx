import { Login } from "@/components/login";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionClient } from "@lens-protocol/client";
import { Feed } from "@/components/feed";
import { getLensClient } from "@/lib/lens/client";

export default async function Home() {

  return (
    <div className="flex w-full h-screen">

      <div className="flex-grow p-4 mx-auto max-w-screen-md overflow-y-auto">
        <Feed />
      </div>

    </div>
  );
}
