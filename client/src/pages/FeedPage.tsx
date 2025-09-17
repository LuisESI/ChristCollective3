import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CreatePostModal } from "@/components/CreatePostModal";
import { PlatformPostCard } from "@/components/PlatformPostCard";
import { MinistryPostCard } from "@/components/MinistryPostCard";
import { FollowSuggestions } from "@/components/FollowSuggestions";
import { Helmet } from "react-helmet";
import { Plus, Sparkles } from "lucide-react";
import { useMemo, ReactNode } from "react";

export default function FeedPage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/platform-posts"],
  });

  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  // Get posts from followed users when user is logged in
  const { data: followingPosts = [] } = useQuery<any[]>({
    queryKey: ["/api/feed/following"],
    enabled: !!user?.id,
  });

  // Get ministry posts from followed ministries
  const { data: ministryPosts = [] } = useQuery<any[]>({
    queryKey: ["/api/feed/ministry-posts"],
    enabled: !!user?.id,
  });

  // Combine and sort all posts by creation date
  const allPosts = useMemo(() => {
    const userPosts = (user && followingPosts && followingPosts.length > 0) ? followingPosts : (posts || []);
    const ministry = ministryPosts || [];
    
    // Combine posts and add type identifier
    const combined = [
      ...((userPosts as any[]) || []).map((post: any) => ({ ...post, postType: 'user' })),
      ...((ministry as any[]) || []).map((post: any) => ({ ...post, postType: 'ministry' }))
    ];
    
    // Sort by creation date (newest first)
    return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, followingPosts, ministryPosts, user]);

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
          {/* Header with Create Post Button */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Community Feed</h1>
              <p className="text-gray-400">Share your faith journey and inspire others</p>
            </div>
            {user && (
              <div>
                <Button 
                  onClick={() => {
                    console.log("Create Post button clicked!");
                    // Test if this works at all
                    alert("Button clicked - checking modal...");
                  }}
                  className="bg-red-500 text-white hover:bg-red-600 mr-2"
                >
                  Debug Click Test
                </Button>
                <CreatePostModal 
                  trigger={
                    <Button className="bg-[#D4AF37] text-black hover:bg-[#B8941F]" data-testid="button-create-post">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Post
                    </Button>
                  }
                />
              </div>
            )}
          </div>

          {/* Posts Grid - Now appears first */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {allPosts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
                  <p>Start following members and ministries to see their inspiring content in your feed!</p>
                </div>
              </div>
            ) : (
              allPosts.map((post: any) => {
                if (post.postType === 'ministry') {
                  return (
                    <MinistryPostCard
                      key={`ministry-${post.id}`}
                      post={post}
                    />
                  );
                } else {
                  return (
                    <PlatformPostCard
                      key={`user-${post.id}`}
                      post={post}
                      currentUserId={user?.id}
                      showActions={true}
                    />
                  );
                }
              }) as React.ReactNode[]
            )}
          </div>

          {/* Load More Button */}
          {posts && (posts as any[]).length >= 50 && (
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