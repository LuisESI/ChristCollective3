import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, DollarSign } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function FeedPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate]);

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    enabled: !!user,
  });

  const { data: creators, isLoading: creatorsLoading } = useQuery({
    queryKey: ["/api/creators"],
    enabled: !!user,
  });

  const { data: ministryPosts, isLoading: ministryPostsLoading } = useQuery({
    queryKey: ["/api/user/ministry-feed"],
    enabled: !!user,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Feed</h1>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.firstName?.[0] || user.username?.[0]}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Welcome Message */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2">Welcome back, {user.firstName || user.username}!</h2>
            <p className="text-white">Stay connected with your faith community and discover new opportunities to make a difference.</p>
          </CardContent>
        </Card>

        {/* Recent Campaigns */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Recent Campaigns</h3>
          {campaignsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns?.slice(0, 3).map((campaign: any) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{campaign.title?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{campaign.title}</h4>
                        <p className="text-sm text-white mt-1">{campaign.description?.substring(0, 100)}...</p>
                        <div className="flex items-center mt-3 space-x-4">
                          <Badge variant="secondary" className="bg-yellow-400 text-black hover:bg-yellow-500">
                            ${(campaign.currentAmount || 0).toLocaleString()} raised
                          </Badge>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <button className="flex items-center space-x-1 hover:text-red-600">
                              <Heart className="h-4 w-4" />
                              <span>Like</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-blue-600">
                              <MessageCircle className="h-4 w-4" />
                              <span>Comment</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-green-600">
                              <Share2 className="h-4 w-4" />
                              <span>Share</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Ministry Posts */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Ministry Updates</h3>
          {ministryPostsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {ministryPosts?.slice(0, 3).map((post: any) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{post.title?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{post.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{post.content?.substring(0, 100)}...</p>
                        <div className="flex items-center mt-3 space-x-4">
                          <Badge variant="secondary">{post.type}</Badge>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <button className="flex items-center space-x-1 hover:text-red-600">
                              <Heart className="h-4 w-4" />
                              <span>Like</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-blue-600">
                              <MessageCircle className="h-4 w-4" />
                              <span>Comment</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-green-600">
                              <Share2 className="h-4 w-4" />
                              <span>Share</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Featured Creators */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Featured Creators</h3>
          {creatorsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {creators?.slice(0, 2).map((creator: any) => (
                <Card key={creator.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={creator.avatar} />
                        <AvatarFallback>{creator.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{creator.displayName}</h4>
                        <p className="text-sm text-gray-600">{creator.description?.substring(0, 80)}...</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <Badge variant="outline">{creator.platform}</Badge>
                          <span className="text-sm text-gray-500">
                            {creator.followers?.toLocaleString()} followers
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Follow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => navigate("/donate/create")}>
                Create Campaign
              </Button>
              <Button variant="outline" onClick={() => navigate("/creators")}>
                Browse Creators
              </Button>
              <Button variant="outline" onClick={() => navigate("/business")}>
                Network
              </Button>
              <Button variant="outline" onClick={() => navigate("/donate")}>
                Donate Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}