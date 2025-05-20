import { Feed } from "@/components/feed";

export default async function Home() {

  return (
    <div className="flex w-full h-screen">
      <div className="flex-grow p-4 mx-auto max-w-screen-md overflow-auto scrollbar-hide">
        <Feed />
      </div>
    </div>
  );
}
