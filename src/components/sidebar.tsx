"use client";

import { Post, ImageMetadata } from "@lens-protocol/client";
import UserMenu from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import React from "react";

interface SidebarProps {
  post?: Post;
  imageMetadata?: ImageMetadata;
  children?: React.ReactNode;
}

export default function Sidebar({ post, imageMetadata, children }: SidebarProps) {
  return (
    <div className="w-96 flex-shrink-0 border-l border-border bg-background p-4 flex flex-col space-y-4 h-screen">
      <div className="mb-auto space-y-4">
        <UserMenu />
        {post && imageMetadata && (
          <div>
            <h2 className="text-xl font-semibold mb-3">{imageMetadata.title || "Untitled Image"}</h2>
            {imageMetadata.content && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{imageMetadata.content}</p>}

            <div className="mt-4 space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">Details</h3>
              {post.author.username?.localName && <p><strong>Author:</strong> {post.author.username.localName}</p>}
              <p><strong>Posted:</strong> {new Date(post.timestamp).toLocaleDateString()}</p>
              {post.id && <p><strong>Post ID:</strong> {post.id}</p>}
            </div>
          </div>
        )}
        {children}
      </div>
      <ThemeToggle />
    </div>
  );
} 