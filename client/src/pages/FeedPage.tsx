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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      <Helmet>
        <title>Feed - Christ Collective</title>
        <meta name="description" content="Discover and share inspiring content from the Christ Collective community" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">


          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts && posts.length > 0 ? (
              posts.map((post: any) => (
                <PlatformPostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  showActions={true}
                />
              ))
            ) : (
              <FollowSuggestions />
            )}
          </div>

          {/* Load More Button */}
          {posts && posts.length >= 50 && (
            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Load More Posts
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}