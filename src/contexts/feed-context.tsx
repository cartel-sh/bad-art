"use client";

import { Post, AnyPost } from "@lens-protocol/client";
import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface FeedState {
  posts: Post[];
  cursor?: string;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  setPosts: (posts: Post[] | ((prevPosts: Post[]) => Post[])) => void;
  setCursor: (cursor?: string) => void;
  setHasMore: (hasMore: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addPosts: (newPosts: Post[]) => void;
  clearFeed: () => void;
}

const FeedContext = createContext<FeedState | undefined>(undefined);

export const FeedProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPostsState] = useState<Post[]>([]);
  const [cursor, setCursorState] = useState<string | undefined>(undefined);
  const [hasMore, setHasMoreState] = useState<boolean>(true);
  const [loading, setLoadingState] = useState<boolean>(true);
  const [error, setErrorState] = useState<string | null>(null);

  const setPosts = useCallback((updater: Post[] | ((prevPosts: Post[]) => Post[])) => {
    setPostsState(updater);
  }, []);

  const setCursor = useCallback((newCursor?: string) => {
    setCursorState(newCursor);
  }, []);

  const setHasMore = useCallback((newHasMore: boolean) => {
    setHasMoreState(newHasMore);
  }, []);

  const setLoading = useCallback((newLoading: boolean) => {
    setLoadingState(newLoading);
  }, []);

  const setError = useCallback((newError: string | null) => {
    setErrorState(newError);
  }, []);

  const addPosts = useCallback((newPosts: Post[]) => {
    setPostsState(prevPosts => [...prevPosts, ...newPosts]);
  }, []);

  const clearFeed = useCallback(() => {
    setPostsState([]);
    setCursorState(undefined);
    setHasMoreState(true);
    setLoadingState(true);
    setErrorState(null);
  }, []);

  return (
    <FeedContext.Provider
      value={{
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
      }}
    >
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = (): FeedState => {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error("useFeed must be used within a FeedProvider");
  }
  return context;
}; 