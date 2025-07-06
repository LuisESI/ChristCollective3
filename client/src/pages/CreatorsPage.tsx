import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, Users, Play, Eye, Heart, Star, Globe, Calendar } from "lucide-react";
import { Link } from "wouter";
import { ContentCreator } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import instagramIconPath from "@assets/db059a4689b94fbb9a3d0a81e9ae8f52-32bits-32_1750620933253.png";
import tiktokIconPath from "@assets/e7fee89a6a10380e09e348c7bd31caf4-32bits-32_1750620982285.png";
import tiktokLogo from "@/assets/tiktok-logo.png";
import instagramLogo from "@/assets/instagram-logo.png";

export default function CreatorsPage() {
  const { user } = useAuth();
  const { data: creators, isLoading } = useQuery<ContentCreator[]>({
    queryKey: ['/api/content-creators'],
    queryFn: async () => {
      const response = await fetch('/api/content-creators?sponsored=true');
      if (!response.ok) throw new Error('Failed to fetch creators');
      return response.json();
    }
  });

  // Fetch featured YouTube video
  const { data: youtubeVideo, isLoading: isYouTubeLoading } = useQuery({
    queryKey: ["/api/youtube/video", "https://youtu.be/ixGHJQXm5kY?si=w00d7O5BiesO0BBt"],
    queryFn: async () => {
      const response = await fetch("/api/youtube/video?url=" + encodeURIComponent("https://youtu.be/ixGHJQXm5kY?si=w00d7O5BiesO0BBt"));
      if (!response.ok) throw new Error("Failed to fetch video data");
      return response.json();
    },
    enabled: true,
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube': return '📺';
      case 'instagram': return <img src={instagramIconPath} alt="Instagram" className="w-6 h-6 object-contain" />;
      case 'tiktok': return <img src={tiktokIconPath} alt="TikTok" className="w-6 h-6 object-contain" />;
      case 'twitter': return '🐦';
      case 'facebook': return '👥';
      case 'linkedin': return '💼';
      case 'twitch': return '🎮';
      default: return '🌐';
    }
  };

  const formatSubscriberCount = (count?: number) => {
    if (!count) return 'N/A';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-amber-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading creators...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-yellow-50">
      {/* Header */}
      <div className="bg-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Creators for <span className="text-yellow-400">Christ</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Discover our sponsored content creators spreading faith-based messages 
            across multiple platforms and watch featured content
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-3 text-lg">
              Apply for Sponsorship
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black font-semibold px-8 py-3 text-lg">
              Learn more
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Content Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Featured Video */}
            {!isYouTubeLoading && youtubeVideo && (
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-white shadow-2xl overflow-hidden">
                  <div className="aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${youtubeVideo.id}`}
                      title={youtubeVideo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full rounded-t-lg"
                    ></iframe>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-black mb-2">{youtubeVideo.title}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{youtubeVideo.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{youtubeVideo.viewCount ? parseInt(youtubeVideo.viewCount).toLocaleString() : 'N/A'} views</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{youtubeVideo.publishedAt ? new Date(youtubeVideo.publishedAt).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-200 ml-4">
                        Featured Video
                      </Badge>
                    </div>
                  </CardContent>
                </Card>


              </div>
            )}
            
            {/* Content Highlights Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Stats */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-black">
                    <Eye className="w-5 h-5 text-yellow-600" />
                    Content Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">50K+</div>
                      <div className="text-xs text-gray-600">Total Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">1.2K</div>
                      <div className="text-xs text-gray-600">Engagements</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">25+</div>
                      <div className="text-xs text-gray-600">Active Creators</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">95%</div>
                      <div className="text-xs text-gray-600">Satisfaction</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Creators Section */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black">Featured Creators</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Meet our sponsored content creators sharing faith-based content with the community.
          </p>
        </div>

        {!creators || creators.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Creators Yet</h3>
              <p className="text-gray-600">
                We're currently reviewing applications. Check back soon!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {creators.map((creator) => (
              <Card key={creator.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={creator.profileImage || ''} alt={creator.name} />
                      <AvatarFallback className="bg-yellow-100 text-yellow-800 text-lg font-semibold">
                        {creator.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-xl text-gray-800">{creator.name}</CardTitle>
                      <Badge className="bg-yellow-400 text-black hover:bg-yellow-500 mt-1">
                        Sponsored Creator
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Bio */}
                  {creator.bio && (
                    <p className="text-gray-600 text-sm line-clamp-2">{creator.bio}</p>
                  )}

                  {/* Content & Audience */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-gray-700 font-medium">Content:</span>
                      <span className="text-sm text-gray-600">{creator.content}</span>
                    </div>
                    {creator.audience && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-gray-700 font-medium">Audience:</span>
                        <span className="text-sm text-gray-600">{creator.audience}</span>
                      </div>
                    )}
                  </div>

                  {/* Platforms */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Platforms:</p>
                    <div className="flex flex-wrap gap-2">
                      {(creator.platforms as any[])?.map((platform, index) => (
                        <div key={index} className="flex items-center gap-1 bg-gray-50 rounded-lg px-3 py-1">
                          <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
                            {typeof getPlatformIcon(platform.platform) === 'string' ? (
                              <span className="text-sm">{getPlatformIcon(platform.platform)}</span>
                            ) : (
                              getPlatformIcon(platform.platform)
                            )}
                          </div>
                          <span className="text-xs font-medium text-gray-700 capitalize">
                            {platform.platform}
                          </span>
                          {platform.subscriberCount && (
                            <Badge className="text-xs ml-1 bg-yellow-400 text-black hover:bg-yellow-500">
                              {formatSubscriberCount(platform.subscriberCount)}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    <Link href={`/creators/${creator.id}`}>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-black">
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}