"use client";

import { useFeed } from "@/contexts/feed-context";
import { getLensClient } from "@/lib/lens/client";
import { resolveUrl } from "@/lib/resolve-url";
import { AnyPost, MainContentFocus, Post, PostType } from "@lens-protocol/client";
import { fetchPosts } from "@lens-protocol/client/actions";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { SkeletonCard } from "./post-skeleton";

const APP = process.env.NEXT_PUBLIC_APP_ADDRESS;

export function Feed() {
  const {
    posts,
    cursor,
    hasMore,
    loading,
    error,
    setPosts,
    setCursor,
    setHasMore,
    setLoading,
    setError,
    addPosts,
    clearFeed,
  } = useFeed();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const getSkeletonCount = () => {
    const screenWidth = window.innerWidth;
    let columnsPerRow = 1;
    
    if (screenWidth >= 768) {
      columnsPerRow = 3;
    } else if (screenWidth >= 640) {
      columnsPerRow = 2;
    }
    
    const remainder = posts.length % columnsPerRow;
    const itemsToFillCurrentRow = remainder === 0 ? 0 : columnsPerRow - remainder;
    const additionalRows = 2; // Show 2 additional full rows
    
    return itemsToFillCurrentRow + (additionalRows * columnsPerRow);
  };

  useEffect(() => {
    const fromPostView = searchParams.get("from") === "postview";

    if (fromPostView && posts.length > 0) {
      const currentPath = window.location.pathname;
      router.replace(currentPath, { scroll: false });
      setLoading(false);
      return;
    }
    if (posts.length === 0) {
      fetchContent();
    } else {
      setLoading(false);
    }
  }, [searchParams, router]);

  const fetchContent = async (currentCursor?: string) => {
    if (!APP) {
      setError("App EVM address is not configured. Please set NEXT_PUBLIC_APP_EVM_ADDRESS in your .env.local file.");
      setLoading(false);
      setHasMore(false);
      return;
    }

    if (!currentCursor) {
      setLoading(true);
    } else {
      setLoading(true);
    }
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

        if (currentCursor) {
          const existingIds = new Set(posts.map(p => p.id));
          const uniqueNewPosts = imagePosts.filter(post => !existingIds.has(post.id));
          if (uniqueNewPosts.length > 0) {
            addPosts(uniqueNewPosts);
          }
        } else {
          setPosts(imagePosts);
        }

        const nextCursor = result.value.pageInfo.next;
        if (nextCursor) {
          setCursor(nextCursor);
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

  const loadMorePosts = () => {
    if (hasMore && cursor && !loading) {
      fetchContent(cursor);
    }
  };

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || !cursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      {
        rootMargin: '100px',
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [hasMore, loading, cursor, posts]);

  if (!APP && !loading && posts.length === 0) {
    return (
      <p className="text-red-500 p-4 text-center">
        Error: App EVM address is not configured. Please set NEXT_PUBLIC_APP_EVM_ADDRESS in your .env.local file.
      </p>
    );
  }

  if (loading && posts.length === 0 && !error) {
    return (
      <div className="container mx-auto px-4 py-8 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return <p className="text-red-500 p-4 text-center">Error fetching posts: {error}</p>;
  }

  if (posts.length === 0 && !loading && !error) {
    return <p className="p-4 text-center">No images found. Try posting some!</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {posts.map((post: Post) => {
          if (post.metadata.__typename !== "ImageMetadata") {
            return null;
          }

          const imageUrl = post.metadata.image.item;
          const resolvedUrl = resolveUrl(imageUrl);
          const imageAlt = post.metadata.image.altTag ?? post.id;

          return (
            <Link key={post.id} href={`/p/${post.slug}`} passHref>
              <motion.div
                layoutId={`${post.id}`}
                className="block bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out aspect-[1/1]"
              >
                <img src={resolvedUrl} alt={imageAlt} className="w-full h-full object-cover" />
              </motion.div>
            </Link>
          );
        })}
        {loading && posts.length > 0 && (
          <>
            {Array.from({ length: getSkeletonCount() }).map((_, index) => (
              <SkeletonCard key={`loading-${index}`} />
            ))}
          </>
        )}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="h-10" />
      )}
    </div>
  );
}
