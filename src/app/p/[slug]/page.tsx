import AuthorInfo from "@/components/author-info";
import PostInteractions from "@/components/post-interactions";
import PostView from "@/components/post-view";
import { getLensClient } from "@/lib/lens/client";
import { resolveUrl } from "@/lib/resolve-url";
import { ImageMetadata, Post } from "@lens-protocol/client";
import { fetchPost } from "@lens-protocol/client/actions";

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  let post: Post | null = null;
  let error: string | null = null;

  try {
    const client = await getLensClient();
    const result = await fetchPost(client, { post: slug });

    if (result.isOk()) {
      post = result.value as Post;
    } else if (!result) {
      error = "Post not found.";
    } else {
      error = "Could not fetch post details or it's not a root post.";
    }
  } catch (e: any) {
    console.error("Fetch Post Error:", e);
    error = e.message || "Failed to fetch post details";
  }

  if (error) {
    return <p className="text-red-500 p-4 text-center">Error: {error}</p>;
  }

  if (!post || post.metadata?.__typename !== "ImageMetadata") {
    return <p className="text-center p-4">Image post not found or metadata is not for an image.</p>;
  }

  const imageMetadata = post.metadata as ImageMetadata;
  const imageUrl = imageMetadata.image?.item;
  const resolvedUrl = imageUrl ? resolveUrl(imageUrl) : undefined;
  const imageAlt = imageMetadata.image?.altTag ?? "Post image";
  const operations = {
    hasUpvoted: post?.operations?.hasUpvoted,
    hasReposted: post?.operations?.hasReposted.optimistic,
  };

  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-center py-8">
      <div className="w-full max-w-lg px-4 mb-4">
        <AuthorInfo post={post} />
      </div>
      <div className="w-full max-w-lg p-4 py-6">
        <PostView post={post} />
      </div>
      <div className="w-full max-w-lg px-4 mt-4">
        <PostInteractions post={post} operations={operations} />
      </div>
    </div>
  );
}
