import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Users, Play, Eye, Heart, Calendar, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { ContentCreator, SocialMediaPost } from "@shared/schema";
import instagramLogo from "@/assets/instagram-icon-new.png";
import tiktokLogo from "@assets/9e020c743d8609911095831c2a867c84-32bits-32_1753981722521.png";
import youtubeIconPath from "@assets/6ed49f7596c2f434dba2edeb8fb15b54-32bits-32_1753981720269.png";
import { buildApiUrl } from "@/lib/api-config";

interface CreatorWithPosts extends ContentCreator {
  posts?: SocialMediaPost[];
  totalFollowers?: number;
}

export default function CreatorProfilePage() {
  const { id } = useParams();

  const { data: creator, isLoading, error } = useQuery<CreatorWithPosts>({
    queryKey: ['/api/content-creators', id],
    queryFn: async () => {
      const response = await fetch(buildApiUrl(`/api/content-creators/${id}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch creator');
      return response.json();
    }
  });

  // Fetch user stats (followers/following counts) 
  const { data: userStats } = useQuery({
    queryKey: ['/api/users', creator?.userId, 'stats'],
    queryFn: async () => {
      if (!creator?.userId) return null;
      const response = await fetch(buildApiUrl(`/api/users/${creator.userId}/stats`), {
        credentials: 'include',
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!creator?.userId
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube': return <img src={youtubeIconPath} alt="YouTube" className="w-6 h-6" />;
      case 'instagram': return <img src={instagramLogo} alt="Instagram" className="w-6 h-6" />;
      case 'tiktok': return <img src={tiktokLogo} alt="TikTok" className="w-6 h-6" />;
      case 'twitter': return <span className="text-2xl">🐦</span>;
      case 'facebook': return <span className="text-2xl">👥</span>;
      case 'linkedin': return <span className="text-2xl">💼</span>;
      case 'twitch': return <span className="text-2xl">🎮</span>;
      default: return <span className="text-2xl">🌐</span>;
    }
  };

  const formatSubscriberCount = (count?: number) => {
    if (!count) return 'N/A';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black dark:bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading creator profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-black dark:bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="bg-gray-900 dark:bg-card rounded-lg border border-gray-800 p-8 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-white dark:text-foreground mb-2">Creator Not Found</h3>
              <p className="text-gray-400 dark:text-muted-foreground mb-4">The creator profile you're looking for doesn't exist.</p>
              <Link href="/creators">
                <Button className="bg-[#D4AF37] hover:bg-[#B8941F] text-black">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Creators
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black dark:bg-background text-white dark:text-foreground">
      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back button */}
        <Link href="/creators">
          <Button variant="ghost" className="mb-4 text-white dark:text-foreground hover:bg-white/10 dark:hover:bg-gray-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Creators
          </Button>
        </Link>
        <div className="flex items-start gap-6 mb-4">
          <Avatar className="w-32 h-32 ring-2 ring-gray-700">
            <AvatarImage src={creator.profileImage || ''} alt={creator.name} />
            <AvatarFallback className="bg-gray-800 text-white text-3xl font-bold">
              {creator.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex flex-col gap-1 mb-2">
              <h2 className="text-xl font-semibold text-left">{creator.name}</h2>
              <Badge className="bg-[#D4AF37] text-black hover:bg-[#B8941F] text-xs px-3 py-1 w-fit rounded-full font-medium">
                ✨ Sponsored Creator
              </Badge>
            </div>
            
            {/* Stats Row - Moved higher */}
            <div className="flex gap-6 mb-3">
              <div className="text-left">
                <div className="text-lg font-semibold">
                  {creator.posts?.length || 0}
                </div>
                <div className="text-xs text-gray-400">posts</div>
              </div>
              <div className="text-left">
                <div className="text-lg font-semibold">
                  {formatSubscriberCount(creator.totalFollowers || 0)}
                </div>
                <div className="text-xs text-gray-400">followers</div>
              </div>
              <div className="text-left">
                <div className="text-lg font-semibold">
                  {userStats?.followingCount || 0}
                </div>
                <div className="text-xs text-gray-400">following</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio - Left aligned */}
        {creator.bio && (
          <div className="mb-4">
            <p className="text-sm leading-relaxed text-left">{creator.bio}</p>
          </div>
        )}
        
        {/* Content Type and Audience - Single line */}
        <div className="text-sm text-gray-400 mb-6 text-left">
          <div>
            Content: {creator.content}
            {creator.audience && ` • Audience: ${creator.audience}`}
            {creator.sponsorshipStartDate && ` • Sponsored since ${formatDate(creator.sponsorshipStartDate)}`}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button className="flex-1 bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium">
            Follow
          </Button>
          <Button variant="outline" className="flex-1 border-gray-600 text-white hover:bg-gray-800">
            Message
          </Button>
        </div>

        {/* Platform Links */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-6">
          {(creator.platforms as any[])?.map((platform, index) => (
            <button
              key={index}
              onClick={() => window.open(platform.profileUrl, '_blank')}
              className="flex flex-col items-center gap-2 min-w-[80px] p-3 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                {getPlatformIcon(platform.platform)}
              </div>
              <div className="text-xs text-center">
                <div className="font-medium capitalize">{platform.platform}</div>
                {platform.subscriberCount && (
                  <div className="text-gray-400 text-[10px]">
                    {formatSubscriberCount(platform.subscriberCount)}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="border-t border-gray-800 mt-6 pt-6">
          {!creator.posts || creator.posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-gray-400 text-sm">
                When {creator.name} shares content, it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {creator.posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => window.open(post.postUrl, '_blank')}
                  className="aspect-square bg-gray-900 rounded-lg overflow-hidden group relative hover:opacity-75 transition-opacity"
                >
                  {post.thumbnailUrl ? (
                    <img 
                      src={post.thumbnailUrl} 
                      alt={post.postTitle || 'Post'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Overlay with stats */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-4 text-white text-sm">
                      {post.likeCount && (
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 fill-white" />
                          <span>{post.likeCount.toLocaleString()}</span>
                        </div>
                      )}
                      {post.viewCount && (
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{post.viewCount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Platform indicator */}
                  <div className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center">
                    <div className="scale-75">
                      {getPlatformIcon(post.platform)}
                    </div>
                  </div>
                  
                  {/* Sponsored indicator */}
                  {post.isSponsored && (
                    <div className="absolute top-2 left-2 bg-[#D4AF37] text-black text-xs px-1.5 py-0.5 rounded-full font-medium">
                      Ad
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}