"use client";

import { getLensClient } from "@/lib/lens/client";
import { AnyPost, evmAddress, MainContentFocus, Post, PostType, SessionClient } from "@lens-protocol/client";
import { fetchPosts } from "@lens-protocol/client/actions";
import { useEffect, useState } from "react";

const APP = process.env.NEXT_PUBLIC_APP_ADDRESS;

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);


  const fetchContent = async (currentCursor?: string) => {
    if (!APP) {
      setError("App EVM address is not configured. Please set NEXT_PUBLIC_APP_EVM_ADDRESS in your .env.local file.");
      setLoading(false);
      setHasMore(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = await getLensClient();
      const result = await fetchPosts(client, {
        filter: {
          apps: [APP],
          postTypes: [PostType.Root],
          metadata: {
            mainContentFocus: [MainContentFocus.Image],
          },
        },
        cursor: currentCursor,
      });

      if (result.isOk()) {
        const fetchedItems = result.value.items;
        const imagePosts = fetchedItems.map((post: AnyPost) => post as Post);

        setPosts(prevPosts => currentCursor ? [...prevPosts, ...imagePosts] : [...imagePosts]);

        if (result.value.pageInfo.next) {
          setCursor(result.value.pageInfo.next);
          setHasMore(true);
        } else {
          setCursor(undefined);
          setHasMore(false);
        }
      } else {
        console.error("Lens API Error:", result.error);
        setError(result.error.message);
        setHasMore(false);
      }
    } catch (e: any) {
      console.error("Fetch Posts Error:", e);
      setError(e.message || "Failed to fetch posts");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const loadMorePosts = () => {
    if (hasMore && cursor && !loading) {
      fetchContent(cursor);
    }
  };

  if (!APP && !loading) {
    return <p className="text-red-500 p-4 text-center">Error: App EVM address is not configured. Please set NEXT_PUBLIC_APP_EVM_ADDRESS in your .env.local file.</p>;
  }

  if (loading && posts.length === 0 && !error) {
    return <p className="p-4 text-center">Loading awesome images...</p>;
  }

  if (error && posts.length === 0) {
    return <p className="text-red-500 p-4 text-center">Error fetching posts: {error}</p>;
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {posts.map((post: Post) => {
          if (post.metadata.__typename !== "ImageMetadata") {
            return null;
          }

          const imageUrl = post.metadata.image.item

          return (
            <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out aspect-[1/1]">
              <img
                src={imageUrl.replace(/^ipfs:\/\//, 'https://ipfs.io/ipfs/')}
                // alt={imageAlt || 'Lens Protocol Image Post'}
                className="w-full h-full object-cover cursor-pointer"
              />
            </div>
          );
        })}
      </div>
      {loading && (
        <p className="text-center mt-8 text-gray-600 dark:text-gray-400">Loading more images...</p>
      )}
      {!loading && hasMore && posts.length > 0 && (
        <div className="flex justify-center mt-10 mb-6">
          <button
            onClick={loadMorePosts}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
          >
            Load More Images
          </button>
        </div>
      )}
      {!loading && !hasMore && posts.length > 0 && (
        <p className="text-center mt-10 mb-6 text-gray-500 dark:text-gray-400">You've reached the end of the image feed!</p>
      )}
    </div>
  );
} 