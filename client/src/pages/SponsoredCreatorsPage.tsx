import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MessageCircle, Share2, Play, ExternalLink, Youtube, Instagram, Globe, Users, TrendingUp, DollarSign, User, Star } from "lucide-react";
import { Link } from "wouter";
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
  const isAuthenticated = !!user;
  const [filter, setFilter] = useState("all");

  // Fetch sponsored content creators
  const { data: creators = [], isLoading } = useQuery({
    queryKey: ["/api/content-creators", { sponsored: true }],
    select: (data) => data as ContentCreator[],
  });

  // Fetch social media posts for the feed
  const { data: socialPosts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ["/api/social-media-posts"],
    select: (data) => data as any[],
  });

  // Fetch real YouTube video data
  const { data: youtubeVideo, isLoading: isYouTubeLoading } = useQuery({
    queryKey: ["/api/youtube/video", "https://youtu.be/ixGHJQXm5kY?si=w00d7O5BiesO0BBt"],
    queryFn: async () => {
      const response = await fetch("/api/youtube/video?url=" + encodeURIComponent("https://youtu.be/ixGHJQXm5kY?si=w00d7O5BiesO0BBt"));
      if (!response.ok) throw new Error("Failed to fetch video data");
      return response.json();
    },
    enabled: true,
  });

  // Get platforms for filtering
  const platformsSet = new Set(creators.map((creator) => creator.platform));
  const platforms = ["all", ...(creators.length > 0 ? Array.from(platformsSet) : [])];

  const filteredCreators = filter === "all" 
    ? creators 
    : creators.filter((creator) => creator.platform.toLowerCase() === filter.toLowerCase());

  // Sample stats for the hero section
  const stats = [
    { icon: Users, label: "Active Creators", value: "12+" },
    { icon: TrendingUp, label: "Monthly Views", value: "50K+" },
    { icon: DollarSign, label: "Sponsorship Fund", value: "$25K+" },
  ];

  // Helper function to format numbers
  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Sponsored Content Feed | Christ Collective</title>
        <meta name="description" content="Discover sponsored faith-based content from our community of creators sharing their testimonies and Christian messages." />
      </Helmet>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-16">
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
            
            {/* Sample Creator 1 */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-4">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>FC</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg text-black mb-2">Faith Creator</h3>
                  <p className="text-sm text-gray-600 mb-3">YouTube • 1.2K subscribers</p>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    Sharing inspiring testimonies and biblical teachings to encourage believers worldwide.
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Youtube className="w-4 h-4 text-red-600" />
                      <span>12 videos</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>2.1K</span>
                    </div>
                  </div>
                  <Link href="/creator/1">
                    <Button size="sm" className="bg-[#D4AF37] hover:bg-[#B8860B] text-black">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Sample Creator 2 */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-4">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>GS</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg text-black mb-2">Grace Stories</h3>
                  <p className="text-sm text-gray-600 mb-3">Instagram • 3.5K followers</p>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    Creating beautiful visual content with scripture and daily encouragement.
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      <span>28 posts</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>1.8K</span>
                    </div>
                  </div>
                  <Link href="/creator/2">
                    <Button size="sm" className="bg-[#D4AF37] hover:bg-[#B8860B] text-black">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Sample Creator 3 */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-4">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>YF</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg text-black mb-2">Young Faith</h3>
                  <p className="text-sm text-gray-600 mb-3">TikTok • 8.9K followers</p>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    Quick Bible verses and faith-based content for the younger generation.
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Globe className="w-4 h-4 text-black" />
                      <span>45 videos</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>15.2K</span>
                    </div>
                  </div>
                  <Link href="/creator/3">
                    <Button size="sm" className="bg-[#D4AF37] hover:bg-[#B8860B] text-black">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
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
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>YT</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="font-semibold text-black">{youtubeVideo.channelTitle}</p>
                    <div className="flex items-center space-x-2">
                      <Youtube className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-gray-500">YouTube • {youtubeVideo.viewCount} views</p>
                    </div>
                  </div>
                  <Badge className="ml-auto bg-[#D4AF37] text-black">Sponsored</Badge>
                </div>
                
                <div className="px-4 pb-2">
                  <h3 className="font-semibold text-black mb-2 line-clamp-2">{youtubeVideo.title}</h3>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                    {youtubeVideo.description.substring(0, 150)}...
                  </p>
                </div>
                
                <a 
                  href={youtubeVideo.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block relative h-48 cursor-pointer group overflow-hidden"
                  style={{
                    backgroundImage: `url(${youtubeVideo.thumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
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
                </a>
                
                <div className="flex items-center justify-between p-4 text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 hover:text-red-500 transition-colors cursor-pointer">
                      <Heart className="w-5 h-5" />
                      <span>{youtubeVideo.likeCount}</span>
                    </div>
                    <div className="flex items-center space-x-1 hover:text-blue-500 transition-colors cursor-pointer">
                      <MessageCircle className="w-5 h-5" />
                      <span>{youtubeVideo.commentCount}</span>
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
                  <AvatarFallback>IG</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="font-semibold text-black">Grace Stories</p>
                  <div className="flex items-center space-x-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    <p className="text-sm text-gray-500">Sample Instagram Post</p>
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
                  <AvatarFallback>TK</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="font-semibold text-black">Young Faith</p>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-black" />
                    <p className="text-sm text-gray-500">Sample TikTok Video</p>
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