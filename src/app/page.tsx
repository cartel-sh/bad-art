import { Feed } from "@/components/feed";
import { Suspense } from "react";

export default async function Home() {
  return (
    <div className="flex w-full max-h-screen overflow-y-auto no-scrollbar">
      <div className="flex-grow p-4 mx-auto max-w-screen-md scrollbar-hide no-scrollbar">
        <Suspense fallback={<div className="p-4 text-center">Loading feed...</div>}>
          <Feed />
        </Suspense>
      </div>
    </div>
  );
}
