import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { 
  ArrowLeft,
  Video, 
  Camera, 
  Share2,
  ExternalLink
} from "lucide-react";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";

export default function CreatorSocialSharePage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check if user has creator profile
  const { data: creatorStatus } = useQuery({
    queryKey: ["/api/user/creator-status"],
    enabled: !!user,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate]);

  // Redirect if not a creator
  useEffect(() => {
    if (user && creatorStatus && !(creatorStatus as any)?.isCreator) {
      toast({
        title: "Creator Profile Required",
        description: "You need a creator profile to share content from other platforms.",
        variant: "destructive",
      });
      navigate("/creators/profile/manage");
    }
  }, [user, creatorStatus, navigate, toast]);

  const platforms = [
    {
      id: "youtube",
      name: "YouTube",
      description: "Import and share your YouTube videos with the community",
      icon: Video,
      color: "text-red-600",
      bgColor: "bg-red-50",
      href: "/creators/share/youtube"
    },
    {
      id: "tiktok", 
      name: "TikTok",
      description: "Import and share your TikTok videos with the community",
      icon: Camera,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      href: "/creators/share/tiktok"
    },
    {
      id: "instagram",
      name: "Instagram", 
      description: "Import and share your Instagram posts with the community",
      icon: Camera,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/creators/share/instagram"
    }
  ];

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Share Social Media Content - Christ Collective</title>
        <meta name="description" content="Import and share content from your social media platforms with the Christ Collective community." />
      </Helmet>
      <div className="min-h-screen bg-black text-white pb-20">
        {/* Header */}
        <div className="bg-black border-b border-gray-800 p-4 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/create")}
              className="text-white hover:bg-white/10 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-50">
                <Share2 className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Share Social Media Content</h1>
                <p className="text-gray-300 text-sm">Choose a platform to import content from</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="space-y-4">
            {platforms.map((platform) => {
              const IconComponent = platform.icon;
              
              return (
                <Card 
                  key={platform.id} 
                  className="hover:shadow-md transition-all duration-200 bg-black border-gray-600 cursor-pointer hover:scale-[1.02]"
                  onClick={() => navigate(platform.href)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className={`p-3 rounded-lg ${platform.bgColor} flex-shrink-0`}>
                        <IconComponent className={`h-6 w-6 ${platform.color}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white text-lg">Share {platform.name} Content</h3>
                          <div className="bg-[#D4AF37] text-black text-xs px-2 py-1 rounded-full font-medium">
                            Creator Only
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm mb-3">{platform.description}</p>
                        
                        <div className="mt-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-gray-600 text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Get Started
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info Section */}
          <Card className="bg-gray-900 border-gray-700 mt-6">
            <CardContent className="p-4">
              <h4 className="font-medium text-white mb-2">How Social Media Sharing Works</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Choose the platform you want to import content from</li>
                <li>• Paste the URL of your video or post</li>
                <li>• We'll import the title, description, and thumbnail</li>
                <li>• Add your personal message and share with the community</li>
                <li>• Your original content link will be preserved for viewers</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}