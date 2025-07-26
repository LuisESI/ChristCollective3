import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CreatePostModal } from "@/components/CreatePostModal";
import { PlatformPostCard } from "@/components/PlatformPostCard";
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-[#D4AF37]" />
              <h1 className="text-3xl font-bold text-white">Community Feed</h1>
              <Sparkles className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <p className="text-gray-400 mb-6">
              Share your journey, discover inspiring content, and connect with fellow believers
            </p>
            
            {user && (
              <CreatePostModal
                trigger={
                  <Button className="bg-[#D4AF37] text-black hover:bg-[#B8941F] text-lg px-8 py-3">
                    <Plus className="w-5 h-5 mr-2" />
                    Share Your Story
                  </Button>
                }
              />
            )}
          </div>

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
              <div className="col-span-full text-center py-12">
                <div className="bg-gray-900 rounded-lg p-8 border border-gray-700">
                  <Sparkles className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Posts Yet</h3>
                  <p className="text-gray-400 mb-6">
                    Be the first to share inspiring content with the community!
                  </p>
                  {user && (
                    <CreatePostModal
                      trigger={
                        <Button className="bg-[#D4AF37] text-black hover:bg-[#B8941F]">
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Post
                        </Button>
                      }
                    />
                  )}
                </div>
              </div>
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