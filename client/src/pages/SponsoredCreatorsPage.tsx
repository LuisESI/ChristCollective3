import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { User, Youtube, Instagram, Twitter, Twitch, Facebook, Globe, Heart, MessageCircle, Share2, Play, ExternalLink, Star } from "lucide-react";

// Define the ContentCreator type
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

  // Filter creators by platform
  const filteredCreators = filter === "all" 
    ? creators 
    : creators.filter((creator) => creator.platform === filter);

  // Helper function to render platform icon
  const renderPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return <Youtube className="h-5 w-5 text-red-600" />;
      case "instagram":
        return <Instagram className="h-5 w-5 text-pink-600" />;
      case "tiktok":
        return <Globe className="h-5 w-5 text-black" />;
      case "twitter":
      case "x":
        return <Twitter className="h-5 w-5 text-blue-400" />;
      case "twitch":
        return <Twitch className="h-5 w-5 text-purple-600" />;
      case "facebook":
        return <Facebook className="h-5 w-5 text-blue-600" />;
      default:
        return <Globe className="h-5 w-5 text-gray-600" />;
    }
  };

  // Format subscriber count
  const formatSubscriberCount = (count?: number) => {
    if (!count) return "N/A";
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return count.toString();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Sponsored Content Feed | Christ Collective</title>
        <meta name="description" content="Discover sponsored faith-based content from our community of creators sharing their testimonies and Christian messages." />
      </Helmet>
      
      {/* Header Section */}
      <div className="bg-black border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-white">Sponsored Content Feed</h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-6">
              Discover inspiring faith-based content from our sponsored creators sharing testimonies, teachings, and Christian messages.
            </p>
            
            {/* Apply Now CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/sponsorship-application">
                <Button size="lg" className="bg-[#D4AF37] hover:bg-[#B8860B] text-black font-semibold px-8 py-3">
                  <Star className="w-5 h-5 mr-2" />
                  Apply for Sponsorship
                </Button>
              </Link>
              <p className="text-sm text-gray-400">Join our community of faith-based content creators</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Feed */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : creators.length === 0 ? (
          <>
            {/* Empty State with Sample Content */}
            <div className="text-center py-12 mb-8">
              <User className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-2 text-black">Building Our Creator Community</h3>
              <p className="text-gray-600 mb-6">
                We're looking for passionate creators to join our sponsorship program and share faith-based content.
              </p>
              <Link to="/sponsorship-application">
                <Button size="lg" className="bg-[#D4AF37] hover:bg-[#B8860B] text-black font-semibold">
                  <Star className="w-5 h-5 mr-2" />
                  Be Our First Creator
                </Button>
              </Link>
            </div>

            {/* Sample Social Media Post Previews */}
            <div className="space-y-6">
              
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
          </>
        ) : (
          /* Actual Content Feed */
          <div className="space-y-6">
            {filteredCreators.map((creator) => (
              <Card key={creator.id} className="bg-white shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={creator.user?.profileImageUrl} />
                        <AvatarFallback>
                          {creator.user?.firstName?.[0] || creator.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{creator.name}</h3>
                          {renderPlatformIcon(creator.platform)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {creator.platform} • {formatSubscriberCount(creator.subscriberCount)} followers
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-[#D4AF37] text-black">Sponsored</Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">{creator.content}</h4>
                    {creator.bio && (
                      <p className="text-gray-700">{creator.bio}</p>
                    )}
                  </div>
                  
                  {creator.audience && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Target Audience:</span> {creator.audience}
                      </p>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="pt-0">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-gray-500">
                        <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                          <Heart className="w-5 h-5" />
                          <span>0</span>
                        </button>
                        <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                          <MessageCircle className="w-5 h-5" />
                          <span>0</span>
                        </button>
                        <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <a 
                      href={creator.profileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visit {creator.platform} Profile
                      </Button>
                    </a>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        {/* Bottom CTA */}
        <div className="mt-12 text-center bg-white rounded-lg shadow-sm border p-8">
          <h3 className="text-2xl font-semibold mb-4 text-black">Ready to Share Your Faith?</h3>
          <p className="text-gray-600 mb-6">
            Join our sponsorship program and get compensated for creating inspiring faith-based content.
          </p>
          <Link href="/sponsorship-application">
            <Button size="lg" className="bg-[#D4AF37] hover:bg-[#B8860B] text-black font-semibold">
              <Star className="w-5 h-5 mr-2" />
              Apply for Sponsorship Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}