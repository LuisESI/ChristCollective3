import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CreatePostModal } from "@/components/CreatePostModal";
import { PlatformPostCard } from "@/components/PlatformPostCard";
import { MinistryPostCard } from "@/components/MinistryPostCard";
import { FollowSuggestions } from "@/components/FollowSuggestions";
import { Helmet } from "react-helmet";
import { Plus, Sparkles, BookOpen, Clock } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { getWordOfTheDay, getTimeUntilReset } from "@/lib/bible-verses";

function WordOfTheDayCard() {
  const { verse, reference } = getWordOfTheDay();
  const [timeLeft, setTimeLeft] = useState(getTimeUntilReset());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilReset());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-[#0A0A0A] to-[#1a1506] border border-[#D4AF37]/30 rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-[#D4AF37] font-semibold text-sm">Word of the Day</h3>
              <p className="text-gray-500 text-[10px] uppercase tracking-wider">Daily Verse</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-gray-500 text-[10px]">
            <Clock className="w-3 h-3" />
            <span>Resets in {timeLeft}</span>
          </div>
        </div>

        <blockquote className="text-gray-200 text-sm leading-relaxed italic mb-3">
          "{verse}"
        </blockquote>

        <p className="text-[#D4AF37] text-xs font-semibold text-right">
          — {reference}
        </p>
      </div>
    </div>
  );
}

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
    const allPlatformPosts = (posts as any[]) || [];
    const followingList = (followingPosts as any[]) || [];
    const ministry = ministryPosts || [];

    let userPosts: any[];
    if (user && followingList.length > 0) {
      const followingIds = new Set(followingList.map((p: any) => p.id));
      const ownPosts = allPlatformPosts.filter((p: any) => p.userId === user.id && !followingIds.has(p.id));
      userPosts = [...followingList, ...ownPosts];
    } else {
      userPosts = allPlatformPosts;
    }

    const seenIds = new Set<string>();
    const combined = [
      ...userPosts.map((post: any) => ({ ...post, postType: 'user' })),
      ...((ministry as any[]) || []).map((post: any) => ({ ...post, postType: 'ministry' }))
    ].filter((post: any) => {
      const key = `${post.postType}-${post.id}`;
      if (seenIds.has(key)) return false;
      seenIds.add(key);
      return true;
    });
    
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
          <WordOfTheDayCard />

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
