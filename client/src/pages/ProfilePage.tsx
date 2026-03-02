import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Edit, ArrowLeft, MessageCircle, User, ExternalLink, Play, Heart, Eye, Bookmark, Camera, AlignLeft } from "lucide-react";
import { PlatformPostCard } from "@/components/PlatformPostCard";
import { FollowersModal } from "@/components/FollowersModal";
import { Link, useLocation, useParams } from "wouter";
import { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { buildApiUrl, getImageUrl, getMobileAuthHeaders } from "@/lib/api-config";
import instagramLogo from "@/assets/instagram-icon-new.png";
import tiktokLogo from "@assets/9e020c743d8609911095831c2a867c84-32bits-32_1753981722521.png";
import youtubeIconPath from "@assets/6ed49f7596c2f434dba2edeb8fb15b54-32bits-32_1753981720269.png";
import { isNativeApp } from "@/lib/platform";

export default function ProfilePage() {
  const { user, isLoading, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const username = params.username;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<"followers" | "following">("followers");
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => {
    return localStorage.getItem('welcomeCardDismissed') === 'true';
  });

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    try {
      const formData = new FormData();
      formData.append('bannerImage', file);
      const res = await fetch(buildApiUrl('/api/upload/banner-image'), {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: getMobileAuthHeaders(),
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      await queryClient.refetchQueries({ queryKey: ['/api/user'] });
      toast({ title: "Banner updated", description: "Your profile banner has been updated." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload banner image.", variant: "destructive" });
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  // If no username in URL, viewing current user's profile
  const isOwnProfile = !username;
  const profileUser = isOwnProfile ? user : null;

  // Redirect to auth page if not authenticated and trying to view own profile
  useEffect(() => {
    if (!isLoading && !user && isOwnProfile) {
      const authRoute = isNativeApp() ? "/auth/mobile" : "/auth";
      navigate(`${authRoute}?redirect=/profile`);
    }
  }, [isLoading, user, isOwnProfile, navigate]);

  // Fetch profile user data by username if viewing someone else's profile
  const { data: fetchedUser, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["/api/users/by-username", username],
    queryFn: async () => {
      if (!username || username === 'null' || username === null) {
        throw new Error('Invalid username');
      }
      const response = await fetch(buildApiUrl(`/api/users/by-username?username=${encodeURIComponent(username)}`), {
        credentials: 'include',
        headers: getMobileAuthHeaders(),
      });
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

  const { data: creatorProfile = {}, isLoading: creatorLoading } = useQuery({
    queryKey: isOwnProfile ? ["/api/user/creator-status"] : ["/api/users/creator-status", displayUser?.id],
    enabled: !!displayUser,
  });

  // Get user's following count and follower stats
  const { data: followingData = [] } = useQuery({
    queryKey: [`/api/users/${displayUser?.id}/following`],
    enabled: !!displayUser?.id,
  });

  // Get user's stats (follower and following counts)
  const { data: userStats = {} } = useQuery({
    queryKey: [`/api/users/${displayUser?.id}/stats`],
    enabled: !!displayUser?.id,
  });

  // Check if current user is following this profile user
  const { data: isFollowingData } = useQuery({
    queryKey: [`/api/users/${displayUser?.id}/is-following`],
    queryFn: async () => {
      if (!user || !displayUser?.id || isOwnProfile) return { isFollowing: false };
      const response = await fetch(buildApiUrl(`/api/users/${displayUser.id}/is-following`), {
        credentials: 'include',
        headers: getMobileAuthHeaders(),
      });
      if (!response.ok) return { isFollowing: false };
      return response.json();
    },
    enabled: !!user && !!displayUser?.id && !isOwnProfile,
  });

  const isFollowing = isFollowingData?.isFollowing || false;

  // Fetch user's platform posts
  const { data: platformPosts = [], isLoading: platformPostsLoading } = useQuery<any[]>({
    queryKey: ["/api/users", displayUser?.id, "posts"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl(`/api/users/${displayUser?.id}/posts`), {
        credentials: 'include',
        headers: getMobileAuthHeaders(),
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!displayUser?.id,
  });

  // Fetch saved posts for own profile
  const { data: savedPosts = [], isLoading: savedPostsLoading } = useQuery<any[]>({
    queryKey: ["/api/saved-posts"],
    enabled: isOwnProfile && !!user,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/users/${displayUser?.id}/follow`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to follow user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${displayUser?.id}/is-following`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${displayUser?.id}/stats`] });
      toast({
        title: "Success",
        description: `You are now following ${displayUser?.firstName || displayUser?.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to follow user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/users/${displayUser?.id}/follow`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to unfollow user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${displayUser?.id}/is-following`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${displayUser?.id}/stats`] });
      toast({
        title: "Success",
        description: `You have unfollowed ${displayUser?.firstName || displayUser?.username}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

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

  const creator = (creatorProfile as any)?.creatorProfile;

  return (
    <>
      <Helmet>
        <title>Profile - Christ Collective</title>
        <meta name="description" content="Your profile on Christ Collective - connect with the Christian community." />
      </Helmet>
      <div className="min-h-screen bg-black text-white pb-20">
        {/* Cover Photo */}
        <div className="relative h-40 md:h-48 bg-gradient-to-b from-gray-900 to-black overflow-hidden">
          {displayUser?.bannerImageUrl ? (
            <img
              src={getImageUrl(displayUser.bannerImageUrl)}
              alt="Profile banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 via-gray-900 to-black" />
          )}
          {isOwnProfile && (
            <>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={bannerUploading}
                className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors z-10"
              >
                {bannerUploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
            </>
          )}
        </div>

        <div className="max-w-4xl mx-auto px-4">
          {/* Avatar overlapping cover + Edit Profile button row */}
          <div className="flex items-end justify-between">
            <Avatar className="w-24 h-24 -mt-12 ring-2 ring-[#D4AF37] border-4 border-black">
              <AvatarImage src={getImageUrl(displayUser?.profileImageUrl || creator?.profileImage)} alt={displayUser?.firstName || displayUser?.username} />
              <AvatarFallback className="bg-gray-800 text-white text-2xl font-bold">
                {displayUser?.firstName?.[0] || displayUser?.username?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex gap-2 pb-2">
              {isOwnProfile ? (
                <>
                  <Button
                    onClick={() => navigate("/edit-profile")}
                    variant="outline"
                    className="border-[#D4AF37] text-white bg-transparent hover:bg-[#D4AF37]/10 font-medium"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    onClick={() => navigate("/settings")}
                    variant="outline"
                    className="border-gray-700 text-white bg-transparent hover:bg-white/10"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="border-gray-700 text-white bg-transparent hover:bg-white/10"
                    onClick={() => {
                      if (!displayUser?.id) {
                        toast({
                          title: "Error",
                          description: "Unable to start chat. Please try again.",
                          variant: "destructive",
                        });
                        return;
                      }
                      const createDirectChat = async () => {
                        try {
                          const response = await apiRequest('/api/direct-chats', {
                            method: 'POST',
                            data: { recipientId: displayUser.id },
                          });
                          if (response.ok) {
                            const chat = await response.json();
                            navigate(`/direct-chat/${chat.id}`);
                          } else {
                            const errorData = await response.json();
                            toast({
                              title: "Error",
                              description: errorData.message || "Failed to start chat",
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          console.error('Error creating direct chat:', error);
                          toast({
                            title: "Error",
                            description: "Failed to start chat. Please try again.",
                            variant: "destructive",
                          });
                        }
                      };
                      createDirectChat();
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button
                    onClick={handleFollowToggle}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className={`font-medium ${
                      isFollowing
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-[#D4AF37] text-black hover:bg-[#B8941F]'
                    }`}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {followMutation.isPending || unfollowMutation.isPending
                      ? '...'
                      : isFollowing ? 'Unfollow' : 'Follow'
                    }
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Name / Username */}
          <div className="mt-3">
            <h2 className="text-2xl font-bold">
              {displayUser?.displayName
                ? displayUser.displayName
                : displayUser?.firstName && displayUser?.lastName
                  ? `${displayUser.firstName} ${displayUser.lastName}`
                  : displayUser?.username}
            </h2>
            <p className="text-gray-400 text-sm">@{displayUser?.username}</p>
            {(creatorProfile as any)?.isCreator && (
              <Badge className="mt-2 bg-[#D4AF37] text-black hover:bg-[#B8941F] text-xs px-3 py-1 w-fit rounded-full font-medium">
                Sponsored Creator
              </Badge>
            )}
          </div>

          {/* Bio */}
          {(creator?.bio || displayUser?.bio) && (
            <div className="mt-3">
              <p className="text-sm leading-relaxed">
                {creator?.bio || displayUser?.bio}
              </p>
            </div>
          )}

          {/* Content Type and Audience */}
          {(creatorProfile as any)?.isCreator && (
            <div className="text-sm text-gray-400 mt-2">
              <div>
                Content: {creator?.content || "Biblical Education / Podcast"}
                {creator?.audience && ` \u2022 Audience: ${creator.audience}`}
                {creator?.sponsorshipStartDate && ` \u2022 Sponsored since ${formatDate(creator.sponsorshipStartDate)}`}
              </div>
            </div>
          )}

          {/* Platform Links */}
          {creator?.platforms && (creator.platforms as any[]).length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 mt-4">
              {(creator.platforms as any[]).map((platform, index) => (
                <button
                  key={index}
                  onClick={() => window.open(platform.profileUrl, '_blank')}
                  className="flex flex-col items-center gap-2 min-w-[80px] p-3 bg-[#0A0A0A] border border-gray-800 rounded-xl hover:bg-[#111] transition-colors"
                >
                  <div className="w-10 h-10 bg-[#0A0A0A] rounded-full flex items-center justify-center border border-gray-800">
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

          {/* Stats Row */}
          <div className="border border-gray-800 rounded-xl p-4 mt-5">
            <div className="flex justify-around text-center">
              <div>
                <div className="text-lg font-semibold text-[#D4AF37]">
                  {platformPosts.length || creator?.posts?.length || creator?.totalPosts || 0}
                </div>
                <div className="text-xs text-gray-400">Posts</div>
              </div>
              <button
                onClick={() => { setFollowersModalTab("followers"); setFollowersModalOpen(true); }}
                className="hover:bg-gray-900 rounded-lg px-3 py-1 transition-colors"
              >
                <div className="text-lg font-semibold text-[#D4AF37]">
                  {(userStats as any)?.followersCount || creator?.totalFollowers || 0}
                </div>
                <div className="text-xs text-gray-400">Followers</div>
              </button>
              <button
                onClick={() => { setFollowersModalTab("following"); setFollowersModalOpen(true); }}
                className="hover:bg-gray-900 rounded-lg px-3 py-1 transition-colors"
              >
                <div className="text-lg font-semibold text-[#D4AF37]">
                  {(userStats as any)?.followingCount || (followingData as any)?.length || 0}
                </div>
                <div className="text-xs text-gray-400">Following</div>
              </button>
            </div>
          </div>

          {displayUser?.id && (
            <FollowersModal
              open={followersModalOpen}
              onOpenChange={setFollowersModalOpen}
              userId={displayUser.id}
              initialTab={followersModalTab}
              currentUserId={user?.id}
              displayName={displayUser?.firstName || displayUser?.username}
            />
          )}

          {/* Welcome message for new users without creator profile - only show for own profile */}
          {isOwnProfile && !(creatorProfile as any)?.isCreator && !welcomeDismissed && (
            <div className="relative text-center mt-5 p-6 bg-gray-900 rounded-xl border border-gray-700">
              <button
                onClick={() => {
                  setWelcomeDismissed(true);
                  localStorage.setItem('welcomeCardDismissed', 'true');
                }}
                className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <h3 className="text-lg font-semibold text-white mb-2">Welcome to Christ Collective!</h3>
              <p className="text-gray-400 text-sm mb-4">
                Choose your path to connect with the Christian community and share your faith journey.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => navigate("/sponsorship-application")}
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
          {isOwnProfile && (creatorProfile as any)?.isCreator && (!creator?.platforms || (creator.platforms as any[]).length === 0) && (
            <div className="text-center mt-5 p-6 bg-gray-900 rounded-xl border border-gray-700">
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

          {/* Posts / Saved Toggle Tabs */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-transparent text-gray-400 border border-gray-700 hover:text-white'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'saved'
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-transparent text-gray-400 border border-gray-700 hover:text-white'
              }`}
            >
              Saved
            </button>
          </div>

          {/* Content Grid */}
          <div className="mt-5">
            {activeTab === 'posts' ? (
              <>
                {platformPostsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto"></div>
                  </div>
                ) : platformPosts.length === 0 && (!creator?.posts || creator.posts.length === 0) ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    {isOwnProfile ? (
                      <>
                        <p className="text-gray-400 text-sm">
                          Your content will appear here once you start sharing.
                        </p>
                        <Button
                          onClick={() => navigate("/create")}
                          className="mt-4 bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Create Post
                        </Button>
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">
                        No content has been shared yet.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-0.5">
                    {platformPosts.map((post: any) => {
                      const firstUrl = post.mediaUrls?.[0] || '';
                      const isBroken = firstUrl.startsWith('blob:') || !firstUrl;
                      const isYoutube = post.mediaType === 'youtube' || post.mediaType === 'youtube_channel';
                      const isVideo = post.mediaType === 'video';
                      const hasMedia = post.mediaUrls && post.mediaUrls.length > 0 && post.mediaType !== 'text' && !isBroken;

                      let thumbUrl: string | null = null;
                      if (isYoutube && firstUrl) {
                        const match = firstUrl.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([^&?\s\/]+)/);
                        if (match?.[1]) {
                          thumbUrl = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
                        }
                      }

                      const showAsText = !hasMedia || (isYoutube && !thumbUrl);

                      return (
                        <Link
                          key={`platform-${post.id}`}
                          href={`/post/${post.id}`}
                          className="aspect-square overflow-hidden group relative block"
                        >
                          {!showAsText ? (
                            <>
                              <div className="absolute inset-0 bg-gray-900">
                                {isVideo ? (
                                  <video
                                    src={getImageUrl(firstUrl)}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    muted
                                    preload="metadata"
                                  />
                                ) : isYoutube && thumbUrl ? (
                                  <img
                                    src={thumbUrl}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src={getImageUrl(firstUrl)}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                )}
                              </div>

                              {(isVideo || isYoutube) && (
                                <div className="absolute top-1.5 right-1.5 bg-black/70 rounded-full p-1 z-10">
                                  <Play className="w-3 h-3 text-white fill-white" />
                                </div>
                              )}

                              {post.mediaUrls.length > 1 && (
                                <div className="absolute top-1.5 left-1.5 bg-black/70 rounded px-1.5 py-0.5 z-10">
                                  <span className="text-[10px] text-white font-medium">+{post.mediaUrls.length - 1}</span>
                                </div>
                              )}

                              {post.content && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2 pt-5 pb-1.5 z-10">
                                  <p className="text-[10px] text-white/90 line-clamp-2 leading-snug">{post.content}</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-black border border-gray-800 flex flex-col justify-between p-3">
                              <AlignLeft className="w-3.5 h-3.5 text-[#D4AF37]/60" />
                              <div className="flex-1 flex flex-col justify-center min-h-0">
                                {post.title && (
                                  <p className="text-[#D4AF37] text-[11px] font-semibold line-clamp-2 leading-snug mb-1">{post.title}</p>
                                )}
                                <p className="text-gray-200 text-[11px] line-clamp-3 leading-relaxed">{post.content}</p>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                <div className="flex items-center gap-0.5">
                                  <Heart className="w-2.5 h-2.5" />
                                  <span>{post.likesCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <MessageCircle className="w-2.5 h-2.5" />
                                  <span>{post.commentsCount || 0}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                            <div className="flex items-center gap-3 text-white text-xs">
                              <div className="flex items-center gap-1">
                                <Heart className="w-3.5 h-3.5 fill-white" />
                                <span>{post.likesCount || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{post.commentsCount || 0}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                    {creator?.posts && creator.posts.length > 0 && creator.posts.map((post: any) => (
                      <button
                        key={`creator-${post.id}`}
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
              </>
            ) : (
              <>
                {!isOwnProfile ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bookmark className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Saved posts are private</h3>
                    <p className="text-gray-400 text-sm">
                      Only you can see your saved posts.
                    </p>
                  </div>
                ) : savedPostsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mx-auto"></div>
                  </div>
                ) : savedPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bookmark className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No saved posts</h3>
                    <p className="text-gray-400 text-sm">
                      Tap the bookmark icon on any post to save it here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedPosts.map((post: any) => (
                      <PlatformPostCard
                        key={`saved-${post.id}`}
                        post={post}
                        currentUserId={user?.id}
                        showActions={true}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}