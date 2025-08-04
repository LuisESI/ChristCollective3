import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PlatformPostCard } from "@/components/PlatformPostCard";

export default function PostPage() {
  const { id } = useParams();
  const postId = parseInt(id || '0');

  const { data: post, isLoading, error } = useQuery({
    queryKey: [`/api/platform-posts/${postId}`],
    enabled: !!postId && !isNaN(postId),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-6"></div>
            <Card className="bg-black border-gray-800">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-32"></div>
                      <div className="h-3 bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-32 bg-gray-700 rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <Link href="/feed">
            <Button variant="ghost" className="text-[#D4AF37] hover:text-white hover:bg-gray-800 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feed
            </Button>
          </Link>
          
          <Card className="bg-black border-gray-800">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Post Not Found</h2>
              <p className="text-gray-400">The post you're looking for doesn't exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <Link href="/feed">
          <Button variant="ghost" className="text-[#D4AF37] hover:text-white hover:bg-gray-800 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Button>
        </Link>
        
        <div className="max-w-2xl mx-auto">
          <PlatformPostCard 
            post={post} 
            currentUserId={currentUser?.id}
            showActions={true}
            expandComments={true}
          />
        </div>
      </div>
    </div>
  );
}