import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Edit, ArrowLeft, MessageCircle, User, ExternalLink, Play, Heart, Eye } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useEffect } from "react";
import { Helmet } from "react-helmet";
import instagramLogo from "@/assets/instagram-icon-new.png";
import tiktokLogo from "@/assets/tiktok-icon-new.png";
import youtubeIconPath from "@assets/8ffe43e003e7013416bd66ce7de71611-32bits-32_1751771363362.png";

export default function ProfilePage() {
  const { user, isLoading, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const username = params.username;
  
  // If no username in URL, viewing current user's profile
  const isOwnProfile = !username;
  const profileUser = isOwnProfile ? user : null;

  // Redirect to login if not authenticated and trying to view own profile
  useEffect(() => {
    if (!isLoading && !user && isOwnProfile) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate, isOwnProfile]);

  // Fetch profile user data by username if viewing someone else's profile
  const { data: fetchedUser, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["/api/users/by-username", username],
    queryFn: async () => {
      if (!username || username === 'null' || username === null) {
        throw new Error('Invalid username');
      }
      const response = await fetch(`/api/users/by-username?username=${encodeURIComponent(username)}`);
      if (!response.ok) {
        throw new Error('User not found');
      }
      return response.json();
    },
    enabled: !!username && username !== 'null',
    retry: false, // Don't retry on 404s
  });

  // Determine which user data to use
  const displayUser = isOwnProfile ? user : fetchedUser;

  const { data: creatorProfile, isLoading: creatorLoading } = useQuery({
    queryKey: isOwnProfile ? ["/api/user/creator-status"] : ["/api/users/creator-status", displayUser?.id],
    enabled: !!displayUser,
  });

  // Get user's following count
  const { data: followingData } = useQuery({
    queryKey: [`/api/users/${displayUser?.id}/following`],
    enabled: !!displayUser?.id,
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

  if (isLoading || (isOwnProfile && !user) || (username && userLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  // If viewing someone else's profile and user not found or invalid username
  if (username && (userError || !fetchedUser || username === 'null')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">User Not Found</h1>
          <p className="text-gray-400 mb-6">The profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")} className="bg-[#D4AF37] text-black hover:bg-[#B8941F]">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const creator = creatorProfile?.creatorProfile;

  return (
    <>
      <Helmet>
        <title>Profile - Christ Collective</title>
        <meta name="description" content="Your profile on Christ Collective - connect with the Christian community." />
      </Helmet>
      <div className="min-h-screen bg-black text-white pb-20">
        {/* Modern Header with Navigation */}
        <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/feed")}
                className="text-white hover:bg-white/10 p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold text-center flex-1">
                {displayUser?.firstName && displayUser?.lastName 
                  ? `${displayUser.firstName} ${displayUser.lastName}`
                  : displayUser?.username}
              </h1>
              {isOwnProfile ? (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/edit-profile")}
                  className="text-white hover:bg-white/10 p-2"
                >
                  <Edit className="w-5 h-5" />
                </Button>
              ) : (
                <div className="w-9 h-9"></div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-start gap-6 mb-4">
            <Avatar className="w-32 h-32 ring-2 ring-gray-700">
              <AvatarImage src={displayUser?.profileImageUrl || creator?.profileImage || ''} alt={displayUser?.firstName || displayUser?.username} />
              <AvatarFallback className="bg-gray-800 text-white text-3xl font-bold">
                {displayUser?.firstName?.[0] || displayUser?.username?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col gap-1 mb-2">
                <h2 className="text-xl font-semibold text-left">
                  {displayUser?.firstName && displayUser?.lastName 
                    ? `${displayUser.firstName} ${displayUser.lastName}`
                    : displayUser?.username}
                </h2>
                <p className="text-gray-400 text-sm">@{displayUser?.username}</p>
                {creatorProfile?.isCreator && (
                  <Badge className="bg-[#D4AF37] text-black hover:bg-[#B8941F] text-xs px-3 py-1 w-fit rounded-full font-medium">
                    ✨ Sponsored Creator
                  </Badge>
                )}
              </div>
              
              {/* Stats Row - Show for all users */}
              <div className="flex gap-6 mb-3">
                <div className="text-left">
                  <div className="text-lg font-semibold">
                    {creator?.posts?.length || creator?.totalPosts || 0}
                  </div>
                  <div className="text-xs text-gray-400">posts</div>
                </div>
                <div className="text-left">
                  <div className="text-lg font-semibold">
                    {creator?.totalFollowers ? 
                      formatSubscriberCount(creator.totalFollowers) : 
                      "0"}
                  </div>
                  <div className="text-xs text-gray-400">followers</div>
                </div>
                <div className="text-left">
                  <div className="text-lg font-semibold">
                    {followingData?.length || 0}
                  </div>
                  <div className="text-xs text-gray-400">following</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio - Left aligned */}
          {(creator?.bio || displayUser?.bio) && (
            <div className="mb-4">
              <p className="text-sm leading-relaxed text-left">
                {creator?.bio || displayUser?.bio}
              </p>
            </div>
          )}
          
          {/* Content Type and Audience - Single line */}
          {creatorProfile?.isCreator && (
            <div className="text-sm text-gray-400 mb-6 text-left">
              <div>
                Content: {creator?.content || "Biblical Education / Podcast"}
                {creator?.audience && ` • Audience: ${creator.audience}`}
                {creator?.sponsorshipStartDate && ` • Sponsored since ${formatDate(creator.sponsorshipStartDate)}`}
              </div>
            </div>
          )}

          {/* Action Buttons - Different for own vs others' profiles */}
          <div className="flex gap-3 mb-6">
            {isOwnProfile ? (
              <>
                <Button 
                  onClick={() => navigate("/edit-profile")}
                  className="flex-1 bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button 
                  onClick={() => navigate("/privacy-settings")}
                  variant="outline" 
                  className="flex-1 border-gray-600 text-white hover:bg-gray-800"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline"
                  className="flex-1 border-gray-600 text-white hover:bg-gray-800"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button 
                  className="flex-1 bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium"
                >
                  <User className="w-4 h-4 mr-2" />
                  Follow
                </Button>
              </>
            )}
          </div>

          {/* Platform Links */}
          {creator?.platforms && (creator.platforms as any[]).length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 mb-6">
              {(creator.platforms as any[]).map((platform, index) => (
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
          )}

          {/* Welcome message for new users without creator profile - only show for own profile */}
          {isOwnProfile && !creatorProfile?.isCreator && (
            <div className="text-center mb-6 p-6 bg-gray-900 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Welcome to Christ Collective!</h3>
              <p className="text-gray-400 text-sm mb-4">
                Choose your path to connect with the Christian community and share your faith journey.
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => navigate("/edit-profile")}
                  className="bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium"
                >
                  Become a Content Creator
                </Button>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => navigate("/business")}
                    variant="outline"
                    className="flex-1 border-gray-600 text-white hover:bg-gray-800"
                  >
                    Business Networking
                  </Button>
                  <Button 
                    onClick={() => navigate("/ministry-profile")}
                    variant="outline"
                    className="flex-1 border-gray-600 text-white hover:bg-gray-800"
                  >
                    Start a Ministry
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Empty state for creators without platforms - only show for own profile */}
          {isOwnProfile && creatorProfile?.isCreator && (!creator?.platforms || (creator.platforms as any[]).length === 0) && (
            <div className="text-center mb-6 p-6 bg-gray-900 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Connect Your Platforms</h3>
              <p className="text-gray-400 text-sm mb-4">
                Link your social media accounts to showcase your content and connect with sponsors.
              </p>
              <Button 
                onClick={() => navigate("/edit-profile")}
                className="bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium"
              >
                Add Platforms
              </Button>
            </div>
          )}



          {/* Content Grid */}
          <div className="border-t border-gray-800 mt-6 pt-6">
            {!creator?.posts || creator.posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-gray-400 text-sm">
                  Your content will appear here once you start sharing.
                </p>
                <Button 
                  onClick={() => navigate("/edit-profile")}
                  className="mt-4 bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Add Content
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {creator.posts.map((post: any) => (
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
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}