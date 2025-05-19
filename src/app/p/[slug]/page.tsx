import { getLensClient } from "@/lib/lens/client";
import { resolveUrl } from "@/lib/resolve-url";
import { Post, ImageMetadata } from "@lens-protocol/client";
import { fetchPost } from "@lens-protocol/client/actions";
import PostView from "@/components/post-view";
import Sidebar from "@/components/sidebar";

export default async function PostPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;

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

  return (
    <div className="flex w-full h-screen overflow-visible">
      <div className="flex-grow">
        <PostView post={post} />
      </div>
      <Sidebar post={post} />
    </div>
  );
} 