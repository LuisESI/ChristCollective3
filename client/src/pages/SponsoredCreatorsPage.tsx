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
  const { isAuthenticated } = useAuth();
  const [filter, setFilter] = useState("all");

  // Fetch sponsored content creators
  const { data: creators = [], isLoading } = useQuery({
    queryKey: ["/api/content-creators", { sponsored: true }],
    select: (data) => data as ContentCreator[],
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
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-black">Sponsored Content Feed</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
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
              <p className="text-sm text-gray-500">Join our community of faith-based content creators</p>
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
              <h3 className="text-2xl font-semibold mb-2">Building Our Creator Community</h3>
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

            {/* Sample Feed Posts to Show What's Coming */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>CC</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="font-semibold text-black">Christ Collective</p>
                    <p className="text-sm text-gray-500">Sample sponsored post</p>
                  </div>
                  <Badge className="ml-auto bg-[#D4AF37] text-black">Sponsored</Badge>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-2 text-black">Coming Soon: Faith-Based Content</h3>
                  <p className="text-gray-700">
                    We're excited to feature inspiring testimonies, biblical teachings, and uplifting content from our sponsored creators. 
                    Join our program to share your faith journey with the world.
                  </p>
                </div>
                
                <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center mb-4">
                  <div className="text-center">
                    <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Sample content placeholder</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-gray-500">
                  <div className="flex items-center space-x-4">
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
                  <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm">View on Platform</span>
                  </button>
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