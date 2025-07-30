import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Heart, MessageCircle, Share2, Send, MoreHorizontal } from "lucide-react";
// import { formatDistanceToNow } from "date-fns";

interface PlatformPostProps {
  post: {
    id: number;
    userId: string;
    authorType: string;
    authorId?: number;
    title?: string;
    content: string;
    mediaUrls?: string[];
    aspectRatio: string;
    mediaType: string;
    tags?: string[];
    isPublished: boolean;
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    createdAt: string;
    updatedAt: string;
  };
  currentUserId?: string;
  showActions?: boolean;
}

export function PlatformPostCard({ post, currentUserId, showActions = true }: PlatformPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data for the post author
  const { data: postAuthor } = useQuery({
    queryKey: ["/api/users/by-id", post.userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/by-id?userId=${encodeURIComponent(post.userId)}`);
      if (!response.ok) {
        throw new Error('User not found');
      }
      return response.json();
    },
    enabled: !!post.userId,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/platform-posts/${post.id}/like`, {
        method: "POST",
      });
    },
    onSuccess: (data: any) => {
      setIsLiked(data.liked);
      setLikesCount(data.likesCount);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest(`/api/platform-posts/${post.id}/comment`, {
        method: "POST",
        data: { content },
      });
    },
    onSuccess: () => {
      setNewComment("");
      toast({ title: "Comment added successfully!" });
      queryClient.invalidateQueries({ queryKey: [`/api/platform-posts/${post.id}/interactions`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (!currentUserId) {
      toast({
        title: "Login required",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleComment = () => {
    if (!currentUserId) {
      toast({
        title: "Login required",
        description: "Please log in to comment",
        variant: "destructive",
      });
      return;
    }
    
    if (!newComment.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    commentMutation.mutate(newComment.trim());
  };



  const getAuthorDisplayName = () => {
    switch (post.authorType) {
      case "creator":
        return "Creator Profile";
      case "business":
        return "Business Profile";
      case "ministry":
        return "Ministry Profile";
      default:
        return "Personal Account";
    }
  };

  // Helper functions for user profile information
  const getUserProfileImage = () => {
    const imageUrl = postAuthor?.profileImageUrl || "";
    console.log("Profile image URL:", imageUrl, "for user:", postAuthor?.username);
    return imageUrl;
  };

  const getUserInitials = () => {
    if (postAuthor?.firstName && postAuthor?.lastName) {
      return `${postAuthor.firstName.charAt(0)}${postAuthor.lastName.charAt(0)}`.toUpperCase();
    }
    if (postAuthor?.username) {
      return postAuthor.username.charAt(0).toUpperCase();
    }
    return post.authorType.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (postAuthor?.firstName && postAuthor?.lastName) {
      return `${postAuthor.firstName} ${postAuthor.lastName}`;
    }
    if (postAuthor?.username) {
      return postAuthor.username;
    }
    return getAuthorDisplayName();
  };

  const getUserUsername = () => {
    return postAuthor?.username || post.userId || "username";
  };

  return (
    <Card className="bg-black border-gray-800 w-full">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={getUserProfileImage()} alt="Profile" />
              <AvatarFallback className="bg-[#D4AF37] text-black">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-white text-sm">{getUserDisplayName()}</p>
              <p className="text-xs text-gray-400">@{getUserUsername()}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Title (if exists) */}
        {post.title && (
          <h3 className="font-semibold text-white text-base mb-2">{post.title}</h3>
        )}

        {/* Content Text */}
        <p className="text-white text-sm leading-relaxed mb-3">{post.content}</p>

        {/* Media Content - Dynamic aspect ratio like Twitter */}
        {post.mediaUrls && post.mediaUrls.length > 0 && post.mediaType !== "text" && (
          <div className="w-full mb-3">
            {post.mediaType === "video" ? (
              <video
                controls
                className="w-full rounded-lg bg-gray-900"
                style={{ maxHeight: '500px' }}
                poster={post.mediaUrls[0]}
              >
                <source src={post.mediaUrls[0]} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={post.mediaUrls[0]}
                alt={post.title || "Post media"}
                className="w-full rounded-lg bg-gray-900"
                style={{ maxHeight: '500px', objectFit: 'cover' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            )}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-gray-800 text-gray-300 text-xs px-2 py-1"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={likeMutation.isPending}
                className={`flex items-center gap-2 ${
                  isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                <span className="text-xs">{likesCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 text-gray-400 hover:text-white"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{post.commentsCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-400 hover:text-white"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-xs">{post.sharesCount}</span>
              </Button>
            </div>
            
            {/* Date moved to bottom right */}
            <div className="text-xs text-gray-500">
              {new Date(post.createdAt).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Comments Section */}
        {showComments && currentUserId && (
          <div className="space-y-3 pt-3 border-t border-gray-700">
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-sm"
              />
              <Button
                onClick={handleComment}
                disabled={commentMutation.isPending || !newComment.trim()}
                className="bg-[#D4AF37] text-black hover:bg-[#B8941F] self-end"
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}