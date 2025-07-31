import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CreatePostModal } from "@/components/CreatePostModal";
import { PlatformPostCard } from "@/components/PlatformPostCard";
import { FollowSuggestions } from "@/components/FollowSuggestions";
import { Helmet } from "react-helmet";
import { Plus, Sparkles } from "lucide-react";

export default function FeedPage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/platform-posts"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  // Get posts from followed users when user is logged in
  const { data: followingPosts } = useQuery({
    queryKey: ["/api/feed/following"],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <Helmet>
        <title>Feed - Christ Collective</title>
        <meta name="description" content="Discover and share inspiring content from the Christ Collective community" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          {/* Posts Grid - Now appears first */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Show posts from followed users if available and user is logged in */}
            {user && followingPosts && followingPosts.length > 0 ? (
              followingPosts.map((post: any) => (
                <PlatformPostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  showActions={true}
                />
              ))
            ) : posts && posts.length > 0 ? (
              posts.map((post: any) => (
                <PlatformPostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  showActions={true}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
                  <p>Start following members to see their inspiring content in your feed!</p>
                </div>
              </div>
            )}
          </div>

          {/* Load More Button */}
          {posts && posts.length >= 50 && (
            <div className="text-center mb-8">
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Load More Posts
              </Button>
            </div>
          )}

          {/* Follow Suggestions - Now appears after posts */}
          <FollowSuggestions />
        </div>
      </div>
    </div>
  );
}