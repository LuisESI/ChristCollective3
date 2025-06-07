import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Play, ExternalLink, Youtube, Instagram, Globe, Users, TrendingUp, DollarSign, Star, Eye, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Helmet } from "react-helmet";

type ContentCreator = {
  id: number;
  name: string;
  platform: string;
  profileUrl: string;
  content: string;
  audience?: string;
  subscriberCount?: number;
  bio?: string;
  isSponsored: boolean;
  sponsorshipStartDate?: Date;
  sponsorshipEndDate?: Date;
  sponsorshipAmount?: string;
  userId: string;
  user?: {
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
};

export default function SponsoredCreatorsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");

  // Fetch sponsored content creators
  const { data: creators = [], isLoading } = useQuery({
    queryKey: ["/api/content-creators", { sponsored: true }],
    select: (data) => data as ContentCreator[],
  });

  // Fetch real YouTube video data for featured content
  const { data: youtubeVideo, isLoading: isYouTubeLoading } = useQuery({
    queryKey: ["/api/youtube/video", "https://youtu.be/ixGHJQXm5kY?si=w00d7O5BiesO0BBt"],
    queryFn: async () => {
      const response = await fetch("/api/youtube/video?url=" + encodeURIComponent("https://youtu.be/ixGHJQXm5kY?si=w00d7O5BiesO0BBt"));
      if (!response.ok) throw new Error("Failed to fetch video data");
      return response.json();
    },
    enabled: true,
  });

  // Fetch authentic channel data from The Matrix Unlocked
  const { data: channelData, isLoading: isChannelLoading } = useQuery({
    queryKey: ["/api/youtube/channel", "theMatrixunlocked369"],
    queryFn: async () => {
      const response = await fetch("/api/youtube/channel?handle=" + encodeURIComponent("theMatrixunlocked369"));
      if (!response.ok) throw new Error("Failed to fetch channel data");
      return response.json();
    },
    enabled: true,
  });

  // Fetch authentic TikTok user data from Luis Lucero
  const { data: tiktokData, isLoading: isTikTokLoading } = useQuery({
    queryKey: ["/api/tiktok/user", "luislucero369"],
    queryFn: async () => {
      const response = await fetch("/api/tiktok/user?username=" + encodeURIComponent("luislucero369"));
      if (!response.ok) throw new Error("Failed to fetch TikTok user data");
      return response.json();
    },
    enabled: true,
  });

  // Fetch authentic Instagram user data from Luis Lucero
  const { data: instagramData, isLoading: isInstagramLoading } = useQuery({
    queryKey: ["/api/instagram/user", "luislucero.03"],
    queryFn: async () => {
      const response = await fetch("/api/instagram/user?username=" + encodeURIComponent("luislucero.03"));
      if (!response.ok) throw new Error("Failed to fetch Instagram user data");
      return response.json();
    },
    enabled: true,
  });

  // Sample stats for the hero section
  const stats = [
    { icon: Users, label: "Active Creators", value: "12+" },
    { icon: TrendingUp, label: "Monthly Views", value: "50K+" },
    { icon: DollarSign, label: "Sponsorship Fund", value: "$25K+" },
  ];

  // Helper function to format numbers
  const formatCount = (count: number | string) => {
    const num = typeof count === 'string' ? parseInt(count) : count;
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Helper function to navigate without nested links
  const navigateToCreator = (id: number) => {
    window.location.href = `/creator/${id}`;
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Sponsored Content Feed | Christ Collective</title>
        <meta name="description" content="Discover sponsored faith-based content from our community of creators sharing their testimonies and Christian messages." />
      </Helmet>
      
      {/* Hero Section */}
      <div className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Sponsored <span className="text-[#D4AF37]">Content</span> Hub
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Discover inspiring faith-based content from our sponsored creators sharing testimonies, teachings, and uplifting messages with the community.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Featured Creators Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 text-black">Featured Creators</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Meet our sponsored content creators sharing faith-based content with the community.
            </p>
          </div>

          {/* Creator Profiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Real YouTube Creator from API data */}
            {isYouTubeLoading ? (
              <Card className="bg-white shadow-sm animate-pulse">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 mx-auto mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-40 mx-auto mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-20 mx-auto"></div>
                  </div>
                </CardContent>
              </Card>
            ) : channelData ? (
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-2 border-[#D4AF37]/20">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-4 border-2 border-[#D4AF37]/30">
                      <AvatarImage src={channelData.thumbnail} />
                      <AvatarFallback className="bg-red-100 text-red-700">
                        {channelData.title?.substring(0, 2) || "TM"}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg text-black mb-2">{channelData.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 flex items-center justify-center gap-1">
                      <Youtube className="w-4 h-4 text-red-600" />
                      YouTube • {channelData.subscriberCount} subscribers
                    </p>
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                      {channelData.description?.substring(0, 100) || "Spiritual teachings and biblical revelations"}...
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Play className="w-4 h-4 text-blue-600" />
                        <span>{channelData.videoCount} videos</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4 text-green-600" />
                        <span>{channelData.viewCount} views</span>
                      </div>
                      <Badge className="bg-[#D4AF37] text-black text-xs">Sponsored</Badge>
                    </div>
                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700 text-white w-full"
                        onClick={() => openExternalLink("https://www.youtube.com/@theMatrixunlocked369")}
                      >
                        <Youtube className="w-4 h-4 mr-2" />
                        Visit Channel
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black w-full"
                        onClick={() => navigateToCreator(1)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    <Youtube className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Unable to load creator data</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Authentic Instagram Creator */}
            {isInstagramLoading ? (
              <Card className="bg-white shadow-sm animate-pulse">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 mx-auto mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-40 mx-auto mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-20 mx-auto"></div>
                  </div>
                </CardContent>
              </Card>
            ) : instagramData ? (
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-2 border-pink-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-4 border-2 border-pink-300">
                      <AvatarImage 
                        src={instagramData.avatar !== '/placeholder-avatar.jpg' ? `/api/proxy-image?url=${encodeURIComponent(instagramData.avatar)}` : '/placeholder-avatar.jpg'}
                        onError={(e) => {
                          console.log('Instagram avatar failed to load, using fallback');
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <AvatarFallback className="bg-pink-100 text-pink-700">
                        {instagramData.displayName?.substring(0, 2) || "LL"}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg text-black mb-2 flex items-center justify-center gap-1">
                      {instagramData.displayName}
                      {instagramData.verified && <Star className="w-4 h-4 text-blue-500" />}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 flex items-center justify-center gap-1">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      Instagram • {instagramData.followerCount} followers
                    </p>
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                      {instagramData.description?.substring(0, 80) || "Christian content creator"}
                      {instagramData.description && instagramData.description.length > 80 ? "..." : ""}
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{instagramData.postCount} posts</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span>{instagramData.followerCount}</span>
                      </div>
                      <Badge className="bg-[#D4AF37] text-black text-xs">Sponsored</Badge>
                    </div>
                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        className="bg-pink-600 hover:bg-pink-700 text-white w-full"
                        onClick={() => openExternalLink(`https://instagram.com/${instagramData.username}`)}
                      >
                        <Instagram className="w-4 h-4 mr-2" />
                        Visit Instagram
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black w-full"
                        onClick={() => navigateToCreator(2)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    <Instagram className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Unable to load creator data</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Authentic TikTok Creator */}
            {isTikTokLoading ? (
              <Card className="bg-white shadow-sm animate-pulse">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 mx-auto mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-40 mx-auto mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-20 mx-auto"></div>
                  </div>
                </CardContent>
              </Card>
            ) : tiktokData ? (
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-2 border-purple-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-4 border-2 border-purple-300">
                      <AvatarImage 
                        src={`/api/proxy-image?url=${encodeURIComponent(tiktokData.avatar)}`}
                        onError={(e) => {
                          console.log('TikTok avatar failed to load, using fallback');
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {tiktokData.displayName?.substring(0, 2) || "YF"}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg text-black mb-2 flex items-center justify-center gap-1">
                      {tiktokData.displayName}
                      {tiktokData.verified && <Star className="w-4 h-4 text-blue-500" />}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 flex items-center justify-center gap-1">
                      <Globe className="w-4 h-4 text-black" />
                      TikTok • {tiktokData.followerCount} followers
                    </p>
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                      {tiktokData.description?.substring(0, 100) || "Faith-based content creator"}...
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Play className="w-4 h-4 text-purple-600" />
                        <span>{tiktokData.videoCount} videos</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span>{tiktokData.likeCount}</span>
                      </div>
                      <Badge className="bg-[#D4AF37] text-black text-xs">Sponsored</Badge>
                    </div>
                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        className="bg-black hover:bg-gray-800 text-white w-full"
                        onClick={() => openExternalLink(`https://tiktok.com/@${tiktokData.username}`)}
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Visit TikTok
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black w-full"
                        onClick={() => navigateToCreator(3)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-4">
                      <AvatarImage src="/placeholder-avatar.jpg" />
                      <AvatarFallback className="bg-purple-100 text-purple-700">YF</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg text-black mb-2">Young Faith</h3>
                    <p className="text-sm text-gray-600 mb-3 flex items-center justify-center gap-1">
                      <Globe className="w-4 h-4 text-black" />
                      TikTok Creator
                    </p>
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                      Quick Bible verses and faith-based content for the younger generation.
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Play className="w-4 h-4" />
                        <span>Featured</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>Sponsored</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-[#D4AF37] hover:bg-[#B8860B] text-black w-full"
                      onClick={() => navigateToCreator(3)}
                    >
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Featured Content Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 text-black">Featured Content</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover inspiring faith-based content from our community creators.
            </p>
          </div>

          {/* Content Feed */}
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Real YouTube Video Preview */}
            {isYouTubeLoading ? (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden animate-pulse">
                <div className="flex items-center p-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="ml-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ) : youtubeVideo ? (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="flex items-center p-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={youtubeVideo.thumbnail} />
                    <AvatarFallback className="bg-red-100 text-red-700">YT</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="font-semibold text-black">{youtubeVideo.channelTitle}</p>
                    <div className="flex items-center space-x-2">
                      <Youtube className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-gray-500">YouTube • {formatCount(youtubeVideo.viewCount)} views</p>
                    </div>
                  </div>
                  <Badge className="ml-auto bg-[#D4AF37] text-black">Sponsored</Badge>
                </div>
                
                <div className="px-4 pb-2">
                  <h3 className="font-semibold text-black mb-2 line-clamp-2">{youtubeVideo.title}</h3>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                    {youtubeVideo.description?.substring(0, 150)}...
                  </p>
                </div>
                
                <div 
                  className="relative h-48 cursor-pointer group overflow-hidden"
                  style={{
                    backgroundImage: `url(${youtubeVideo.thumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                  onClick={() => openExternalLink(`https://youtu.be/${youtubeVideo.id}`)}
                >
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                  <div className="relative text-center text-white h-full flex items-center justify-center">
                    <div className="bg-red-600 rounded-full p-4 mb-2 mx-auto w-20 h-20 flex items-center justify-center group-hover:bg-red-500 transition-all duration-300 group-hover:scale-110">
                      <Play className="w-10 h-10 ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-white text-xs">
                    {youtubeVideo.duration}
                  </div>
                  <div className="absolute top-2 right-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 hover:text-red-500 transition-colors cursor-pointer">
                      <Heart className="w-5 h-5" />
                      <span>{formatCount(youtubeVideo.likeCount)}</span>
                    </div>
                    <div className="flex items-center space-x-1 hover:text-blue-500 transition-colors cursor-pointer">
                      <MessageCircle className="w-5 h-5" />
                      <span>{formatCount(youtubeVideo.commentCount)}</span>
                    </div>
                    <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(youtubeVideo.publishedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-4 text-center text-gray-500">
                  <Youtube className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Unable to load video data</p>
                </div>
              </div>
            )}

            {/* Instagram Post Preview */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="flex items-center p-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="bg-pink-100 text-pink-700">GS</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="font-semibold text-black">Grace Stories</p>
                  <div className="flex items-center space-x-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    <p className="text-sm text-gray-500">Instagram</p>
                  </div>
                </div>
                <Badge className="ml-auto bg-[#D4AF37] text-black">Sponsored</Badge>
              </div>
              
              <div className="bg-gradient-to-br from-pink-100 to-purple-100 h-64 flex items-center justify-center">
                <div className="text-center p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">"Be still and know that I am God"</h3>
                  <p className="text-gray-600">- Psalm 46:10</p>
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-gray-700 text-sm mb-3">
                  Sometimes we need to pause and remember that God is in control. What verse brings you peace today? 🙏 #Faith #Peace #God
                </p>
                <div className="flex items-center justify-between text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-5 h-5" />
                      <span>543</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-5 h-5" />
                      <span>42</span>
                    </div>
                    <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-400">1 week ago</div>
                </div>
              </div>
            </div>

            {/* TikTok Video Preview */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="flex items-center p-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="bg-purple-100 text-purple-700">YF</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="font-semibold text-black">Young Faith</p>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-black" />
                    <p className="text-sm text-gray-500">TikTok</p>
                  </div>
                </div>
                <Badge className="ml-auto bg-[#D4AF37] text-black">Sponsored</Badge>
              </div>
              
              <div className="relative bg-gradient-to-br from-purple-900 to-pink-900 h-80 flex items-center justify-center cursor-pointer group">
                <div className="text-center text-white">
                  <div className="bg-white/20 rounded-full p-4 mb-3 mx-auto w-16 h-16 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Play className="w-8 h-8 ml-1" />
                  </div>
                  <h4 className="font-semibold mb-2">3 Bible Verses for Tough Days</h4>
                  <p className="text-sm opacity-80">Quick encouragement for your day</p>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-between text-white text-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>8.9K</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>234</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Share2 className="w-4 h-4" />
                        <span>156</span>
                      </div>
                    </div>
                    <div className="bg-black/50 px-2 py-1 rounded text-xs">0:45</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}