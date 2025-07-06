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
import tiktokLogo from "@/assets/tiktok-icon-new.png";
import youtubeIconPath from "@assets/8ffe43e003e7013416bd66ce7de71611-32bits-32_1751771363362.png";

interface CreatorWithPosts extends ContentCreator {
  posts?: SocialMediaPost[];
}

export default function CreatorProfilePage() {
  const { id } = useParams();

  const { data: creator, isLoading, error } = useQuery<CreatorWithPosts>({
    queryKey: ['/api/content-creators', id],
    queryFn: async () => {
      const response = await fetch(`/api/content-creators/${id}`);
      if (!response.ok) throw new Error('Failed to fetch creator');
      return response.json();
    }
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
      <div className="min-h-screen bg-gradient-to-br from-white to-amber-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading creator profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-amber-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Creator Not Found</h3>
              <p className="text-gray-600 mb-4">The creator profile you're looking for doesn't exist.</p>
              <Link href="/creators">
                <Button className="bg-amber-600 hover:bg-amber-700">
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
    <div className="min-h-screen bg-gradient-to-br from-white to-amber-50">
      {/* Header */}
      <div className="bg-black text-white py-8">
        <div className="container mx-auto px-4">
          <Link href="/creators">
            <Button variant="ghost" className="text-white hover:bg-white/10 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Creators
            </Button>
          </Link>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24 md:w-32 md:h-32">
              <AvatarImage src={creator.profileImage || ''} alt={creator.name} />
              <AvatarFallback className="bg-amber-100 text-amber-800 text-2xl md:text-3xl font-bold">
                {creator.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-3xl md:text-4xl font-bold">Luis Lucero</h1>
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 w-fit">
                  Sponsored Creator
                </Badge>
              </div>
              
              {creator.bio && (
                <p className="text-lg text-gray-300 mb-4">{creator.bio}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-amber-400" />
                  <span>Content: {creator.content}</span>
                </div>
                {creator.audience && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Audience: {creator.audience}</span>
                  </div>
                )}
                {creator.sponsorshipStartDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Sponsored since: {formatDate(creator.sponsorshipStartDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Social Media Platforms */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                  Social Media Platforms
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                {(creator.platforms as any[])?.map((platform, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 flex-1 min-w-[250px] max-w-[300px]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                        {getPlatformIcon(platform.platform)}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium capitalize text-black text-lg">{platform.platform}</span>
                        {platform.subscriberCount && (
                          <div className="mt-1">
                            <Badge className="bg-yellow-400 text-black border-yellow-400 text-xs">
                              {formatSubscriberCount(platform.subscriberCount)} followers
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full bg-black text-white hover:bg-gray-800"
                      onClick={() => window.open(platform.profileUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Profile
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Content & Posts */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                  <Play className="w-5 h-5 text-amber-600" />
                  Recent Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!creator.posts || creator.posts.length === 0 ? (
                  <div className="text-center py-8">
                    <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Content Yet</h3>
                    <p className="text-gray-600">
                      This creator hasn't shared any content posts yet. Check back soon!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {creator.posts.map((post) => (
                      <div key={post.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          {post.thumbnailUrl && (
                            <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                src={post.thumbnailUrl} 
                                alt={post.postTitle || 'Post thumbnail'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="text-lg">{getPlatformIcon(post.platform)}</div>
                              <Badge variant="outline" className={`capitalize ${post.platform.toLowerCase() === 'instagram' || post.platform.toLowerCase() === 'tiktok' ? 'bg-black text-white border-black' : ''}`}>
                                {post.platform}
                              </Badge>
                              {post.isSponsored && (
                                <Badge className="bg-amber-100 text-amber-800">
                                  Sponsored
                                </Badge>
                              )}
                            </div>
                            
                            {post.postTitle && (
                              <h4 className="font-semibold text-gray-800 mb-2">{post.postTitle}</h4>
                            )}
                            
                            {post.postDescription && (
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.postDescription}</p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                {post.viewCount && (
                                  <div className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    <span>{post.viewCount.toLocaleString()}</span>
                                  </div>
                                )}
                                {post.likeCount && (
                                  <div className="flex items-center gap-1">
                                    <Heart className="w-4 h-4" />
                                    <span>{post.likeCount.toLocaleString()}</span>
                                  </div>
                                )}
                                {post.postedAt && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(post.postedAt)}</span>
                                  </div>
                                )}
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(post.postUrl, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Post
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}