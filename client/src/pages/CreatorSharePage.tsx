import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useLocation, useParams } from "wouter";
import { useEffect } from "react";
import { 
  ArrowLeft,
  Video, 
  Camera, 
  ExternalLink,
  Import,
  Share2,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function CreatorSharePage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams();
  const platform = params.platform; // youtube, tiktok, instagram
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [contentUrl, setContentUrl] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importedContent, setImportedContent] = useState<any>(null);

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
    if (user && creatorStatus && !creatorStatus.isCreator) {
      toast({
        title: "Creator Profile Required",
        description: "You need a creator profile to share content from other platforms.",
        variant: "destructive",
      });
      navigate("/creators/profile/manage");
    }
  }, [user, creatorStatus, navigate, toast]);

  const importContentMutation = useMutation({
    mutationFn: async (url: string) => {
      setIsImporting(true);
      return await apiRequest(`/api/creators/import/${platform}`, {
        method: "POST",
        data: { url, platform },
      });
    },
    onSuccess: (data) => {
      setImportedContent(data);
      setIsImporting(false);
      toast({
        title: "Content imported successfully!",
        description: "Review and customize your post before sharing.",
      });
    },
    onError: (error: any) => {
      setIsImporting(false);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import content from this URL.",
        variant: "destructive",
      });
    },
  });

  const shareContentMutation = useMutation({
    mutationFn: async (postData: any) => {
      return await apiRequest("/api/platform-posts", {
        method: "POST",
        data: postData,
      });
    },
    onSuccess: () => {
      toast({ title: "Content shared successfully!" });
      navigate("/feed");
      queryClient.invalidateQueries({ queryKey: ["/api/platform-posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to share content",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImport = () => {
    if (!contentUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a valid URL to import content.",
        variant: "destructive",
      });
      return;
    }
    importContentMutation.mutate(contentUrl.trim());
  };

  const handleShare = () => {
    if (!importedContent) return;

    const postData = {
      title: importedContent.title,
      content: customMessage || importedContent.description || `Check out my latest ${platform} content!`,
      authorType: "creator",
      authorId: creatorStatus?.creatorProfile?.id,
      mediaType: platform === "youtube" ? "video" : "image",
      mediaUrls: [importedContent.thumbnailUrl || importedContent.imageUrl],
      tags: [`#${platform}`, "#creator", "#faith"],
      externalUrl: contentUrl, // Store original URL for linking back
      platform: platform,
    };

    shareContentMutation.mutate(postData);
  };

  const getPlatformInfo = () => {
    switch (platform) {
      case "youtube":
        return {
          name: "YouTube",
          icon: Video,
          color: "text-red-600",
          bgColor: "bg-red-50",
          placeholder: "https://youtube.com/watch?v=...",
          description: "Import videos from your YouTube channel"
        };
      case "tiktok":
        return {
          name: "TikTok", 
          icon: Camera,
          color: "text-pink-600",
          bgColor: "bg-pink-50",
          placeholder: "https://tiktok.com/@username/video/...",
          description: "Import videos from your TikTok profile"
        };
      case "instagram":
        return {
          name: "Instagram",
          icon: Camera, 
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          placeholder: "https://instagram.com/p/...",
          description: "Import posts from your Instagram account"
        };
      default:
        return {
          name: "Platform",
          icon: Share2,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          placeholder: "Enter content URL...",
          description: "Import content from external platform"
        };
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  const platformInfo = getPlatformInfo();
  const IconComponent = platformInfo.icon;

  return (
    <>
      <Helmet>
        <title>Share {platformInfo.name} Content - Christ Collective</title>
        <meta name="description" content={`Import and share your ${platformInfo.name} content with the Christ Collective community.`} />
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
              <div className={`p-2 rounded-lg ${platformInfo.bgColor}`}>
                <IconComponent className={`h-6 w-6 ${platformInfo.color}`} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Share {platformInfo.name} Content</h1>
                <p className="text-gray-300 text-sm">{platformInfo.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="space-y-6">
            {/* Import Section */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Import className="w-5 h-5 text-[#D4AF37]" />
                  Import Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    {platformInfo.name} URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={contentUrl}
                      onChange={(e) => setContentUrl(e.target.value)}
                      placeholder={platformInfo.placeholder}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      disabled={isImporting}
                    />
                    <Button
                      onClick={handleImport}
                      disabled={isImporting || !contentUrl.trim()}
                      className="bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                    >
                      {isImporting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Import"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Paste the URL of your {platformInfo.name} content to import it
                  </p>
                </div>

                {/* Import Status */}
                {isImporting && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Importing content from {platformInfo.name}...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview Section */}
            {importedContent && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Content Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Content Preview */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    {importedContent.thumbnailUrl && (
                      <img 
                        src={importedContent.thumbnailUrl} 
                        alt={importedContent.title}
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h3 className="font-medium text-white mb-2">{importedContent.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">{importedContent.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {platformInfo.name}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(contentUrl, '_blank')}
                        className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Original
                      </Button>
                    </div>
                  </div>

                  {/* Custom Message */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Add Your Message (Optional)
                    </label>
                    <Textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder={`Share your thoughts about this ${platformInfo.name} content...`}
                      rows={3}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>

                  {/* Share Button */}
                  <Button
                    onClick={handleShare}
                    disabled={shareContentMutation.isPending}
                    className="w-full bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                  >
                    {shareContentMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sharing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Share with Community
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-white mb-1">How it works</h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Paste your {platformInfo.name} content URL above</li>
                      <li>• We'll import the title, description, and thumbnail</li>
                      <li>• Add your personal message to share with the community</li>
                      <li>• Your original content link will be preserved for viewers</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}