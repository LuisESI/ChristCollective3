import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CreatePostModal } from "@/components/CreatePostModal";
import { PlatformPostCard } from "@/components/PlatformPostCard";
import { MinistryPostCard } from "@/components/MinistryPostCard";
import { FollowSuggestions } from "@/components/FollowSuggestions";
import { Helmet } from "react-helmet";
import { Plus, Sparkles } from "lucide-react";
import { useMemo } from "react";

export default function FeedPage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/platform-posts"],
  });

  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  const { data: followingPosts = [] } = useQuery<any[]>({
    queryKey: ["/api/feed/following"],
    enabled: !!user?.id,
  });

  const { data: ministryPosts = [] } = useQuery<any[]>({
    queryKey: ["/api/feed/ministry-posts"],
    enabled: !!user?.id,
  });

  const allPosts = useMemo(() => {
    const userPosts = (user && followingPosts && followingPosts.length > 0) ? followingPosts : (posts || []);
    const ministry = ministryPosts || [];
    
    const combined = [
      ...((userPosts as any[]) || []).map((post: any) => ({ ...post, postType: 'user' })),
      ...((ministry as any[]) || []).map((post: any) => ({ ...post, postType: 'ministry' }))
    ];
    
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

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="space-y-4">
          {allPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400">
                <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
                <p className="text-sm">Start following members and ministries to see their inspiring content in your feed!</p>
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

        {posts && (posts as any[]).length >= 50 && (
          <div className="text-center my-8">
            <Button 
              variant="outline" 
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Load More Posts
            </Button>
          </div>
        )}

        <FollowSuggestions />
      </div>

      {user && (
        <div className="fixed bottom-20 right-4 z-40">
          <CreatePostModal 
            trigger={
              <button className="w-14 h-14 rounded-full bg-[#D4AF37] hover:bg-[#B8941F] text-black shadow-lg shadow-[#D4AF37]/30 flex items-center justify-center transition-all hover:scale-105" data-testid="button-create-post">
                <Plus className="w-6 h-6" />
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}
