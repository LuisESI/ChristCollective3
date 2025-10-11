import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Calendar, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { useAuthGuard } from "@/lib/auth-guard";
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
  expandComments?: boolean;
  disablePostClick?: boolean;
}

export function PlatformPostCard({ post, currentUserId, showActions = true, expandComments = false, disablePostClick = false }: PlatformPostProps) {
  const [showComments, setShowComments] = useState(expandComments);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { requireAuth } = useAuthGuard();

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

  // Fetch ministry data - try for all posts since platform posts might include ministry content
  const { data: ministryData } = useQuery({
    queryKey: ["/api/ministry-posts", post.id],
    queryFn: async () => {
      const response = await fetch(`/api/ministry-posts/${post.id}`);
      if (!response.ok) {
        return null; // Not a ministry post
      }
      return response.json();
    },
    enabled: !!post.id, // Enable for all posts to check if they're ministry posts
  });

  // Fetch comments for the post
  const { data: comments = [] } = useQuery<any[]>({
    queryKey: [`/api/platform-posts/${post.id}/comments`],
    enabled: showComments || expandComments,
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
      queryClient.invalidateQueries({ queryKey: [`/api/platform-posts/${post.id}/comments`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/platform-posts/${post.id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/following"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${post.userId}/posts`] });
      toast({
        title: "Post deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return await apiRequest(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/platform-posts/${post.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-posts"] });
      toast({
        title: "Comment deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    requireAuth(() => {
      likeMutation.mutate();
    }, "Please sign in to like posts");
  };

  const handleComment = () => {
    requireAuth(() => {
      if (!newComment.trim()) {
        toast({
          title: "Comment required",
          description: "Please enter a comment",
          variant: "destructive",
        });
        return;
      }
      commentMutation.mutate(newComment.trim());
    }, "Please sign in to comment");
  };

  const handleShare = () => {
    requireAuth(() => {
      toast({
        title: "Share",
        description: "Share functionality coming soon!",
      });
    }, "Please sign in to share posts");
  };

  const handleDeletePost = () => {
    if (!currentUserId) {
      toast({
        title: "Login required",
        description: "Please log in to delete posts",
        variant: "destructive",
      });
      return;
    }

    if (post.userId !== currentUserId) {
      toast({
        title: "Not authorized",
        description: "You can only delete your own posts",
        variant: "destructive",
      });
      return;
    }

    if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      deletePostMutation.mutate();
    }
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      deleteCommentMutation.mutate(commentId);
    }
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
    if (post.authorType) {
      return post.authorType.charAt(0).toUpperCase();
    }
    return "U"; // Default fallback
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

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't navigate if disabled or clicking on interactive elements
    if (disablePostClick || (e.target as HTMLElement).closest('button, input, textarea, a')) {
      return;
    }
    window.location.href = `/post/${post.id}`;
  };

  return (
    <Card 
      className={`bg-black border-gray-800 w-full transition-colors ${
        disablePostClick ? '' : 'cursor-pointer hover:bg-gray-900/20'
      }`}
      onClick={handlePostClick}
    >
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-white z-10 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
              {currentUserId && post.userId === currentUserId && (
                <DropdownMenuItem 
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePost();
                  }}
                  disabled={deletePostMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Title */}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike();
                }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  requireAuth(() => {
                    setShowComments(!showComments);
                  }, "Please sign in to view and add comments");
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-white"
                data-testid="button-comment"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{post.commentsCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-white"
                data-testid="button-share"
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
        {(showComments || expandComments) && (
          <div className="space-y-3 pt-3">
            {/* Existing Comments */}
            {Array.isArray(comments) && comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {comments.map((comment: any) => (
                  <div 
                    key={comment.id} 
                    className="flex gap-2 items-start group hover:bg-gray-800/30 rounded-md p-1 -m-1 transition-colors"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={comment.user?.profileImageUrl} alt={comment.user?.firstName} />
                      <AvatarFallback className="bg-gray-700 text-gray-300 text-xs">
                        {comment.user?.firstName?.[0] || comment.user?.username?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-semibold text-white">
                          {comment.user?.firstName || comment.user?.username || "User"}
                        </span>
                        <span className="text-gray-300 ml-2">{comment.content}</span>
                      </div>
                    </div>
                    {currentUserId && comment.userId === currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-900/20 h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteComment(comment.id);
                        }}
                        disabled={deleteCommentMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Add Comment Form */}
            {currentUserId && (
              <div className="flex gap-2 items-center">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={1}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-sm resize-none h-8 min-h-[32px] max-h-[32px] py-1"
                />
                <Button
                  onClick={handleComment}
                  disabled={commentMutation.isPending || !newComment.trim()}
                  className="bg-[#D4AF37] text-black hover:bg-[#B8941F] h-8 w-8 p-0 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}