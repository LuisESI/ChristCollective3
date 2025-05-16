import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { User, Youtube, Instagram, Twitter, Twitch, Facebook, Globe } from "lucide-react";

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
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>Sponsored Content Creators | Christ Collective</title>
        <meta name="description" content="Discover content creators sponsored by Christ Collective sharing faith-based content across various platforms." />
      </Helmet>
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Our Sponsored Content Creators</h1>
        <p className="text-lg max-w-3xl mx-auto">
          Christ Collective proudly sponsors these creators who share faith-based content across various platforms. 
          Their work helps spread the message and mission of our community.
        </p>
        
        {isAuthenticated && (
          <div className="mt-6">
            <Link href="/sponsorship-application">
              <Button className="bg-[#D4AF37] hover:bg-[#B8860B] text-black">
                Apply for Sponsorship
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : creators.length === 0 ? (
        <div className="text-center p-12 border rounded-lg">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-xl font-semibold">No Sponsored Creators Yet</h3>
          <p className="mt-2 text-gray-500">
            We're currently reviewing applications. Check back soon for our sponsored content creators.
          </p>
        </div>
      ) : (
        <>
          <Tabs defaultValue="all" className="mb-8">
            <div className="flex justify-center">
              <TabsList>
                {platforms.map((platform) => (
                  <TabsTrigger 
                    key={platform} 
                    value={platform}
                    onClick={() => setFilter(platform)}
                  >
                    {platform === "all" ? "All Platforms" : platform}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCreators.map((creator) => (
              <Card key={creator.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{creator.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        {renderPlatformIcon(creator.platform)}
                        <span className="ml-1">{creator.platform}</span>
                        {creator.subscriberCount && (
                          <Badge variant="outline" className="ml-2">
                            {formatSubscriberCount(creator.subscriberCount)} followers
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm">Content Focus</h4>
                      <p>{creator.content}</p>
                    </div>
                    {creator.audience && (
                      <div>
                        <h4 className="font-semibold text-sm">Target Audience</h4>
                        <p>{creator.audience}</p>
                      </div>
                    )}
                    {creator.bio && (
                      <div>
                        <h4 className="font-semibold text-sm">Bio</h4>
                        <p className="line-clamp-3">{creator.bio}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <a 
                    href={creator.profileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full">
                      Visit {creator.platform} Profile
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}