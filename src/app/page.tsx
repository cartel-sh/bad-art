import { Feed } from "@/components/feed";

export default async function Home() {
  return (
    <div className="flex w-full max-h-screen overflow-y-auto no-scrollbar">
      <div className="flex-grow p-4 mx-auto max-w-screen-md scrollbar-hide no-scrollbar">
        <Feed />
      </div>
    </div>
  );
}
