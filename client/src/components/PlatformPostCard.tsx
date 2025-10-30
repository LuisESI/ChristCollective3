import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { buildApiUrl, getImageUrl } from "@/lib/api-config";
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Calendar, Trash2, Youtube, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

// Helper function to extract YouTube video ID from various URL formats
const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

export function PlatformPostCard({ post, currentUserId, showActions = true, expandComments = false, disablePostClick = false }: PlatformPostProps) {
  const [showComments, setShowComments] = useState(expandComments);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: post.title || "",
    content: post.content || "",
    tags: post.tags || [],
  });
  const [newTag, setNewTag] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { requireAuth } = useAuthGuard();

  // Fetch user data for the post author
  const { data: postAuthor } = useQuery({
    queryKey: ["/api/users/by-id", post.userId],
    queryFn: async () => {
      const response = await fetch(buildApiUrl(`/api/users/by-id?userId=${encodeURIComponent(post.userId)}`), {
        credentials: 'include',
      });
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
      const response = await fetch(buildApiUrl(`/api/ministry-posts/${post.id}`), {
        credentials: 'include',
      });
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

  const editPostMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; tags: string[] }) => {
      return await apiRequest(`/api/platform-posts/${post.id}`, {
        method: 'PATCH',
        data,
      });
    },
    onSuccess: async (updatedPost) => {
      // Invalidate all relevant queries
      await queryClient.invalidateQueries({ queryKey: ["/api/platform-posts"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/feed/following"] });
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${post.userId}/posts`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/platform-posts/${post.id}`] });
      
      // Refetch the specific post to update the UI immediately
      await queryClient.refetchQueries({ queryKey: [`/api/platform-posts/${post.id}`] });
      
      setShowEditModal(false);
      toast({
        title: "Post updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating post",
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

  const handleEditPost = () => {
    setEditFormData({
      title: post.title || "",
      content: post.content || "",
      tags: post.tags || [],
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editFormData.content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some content for your post",
        variant: "destructive",
      });
      return;
    }
    editPostMutation.mutate(editFormData);
  };

  const addTag = () => {
    if (newTag.trim() && !editFormData.tags.includes(newTag.trim())) {
      setEditFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
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
    return getImageUrl(imageUrl);
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
                <>
                  <DropdownMenuItem 
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPost();
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Post
                  </DropdownMenuItem>
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
                </>
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
            {post.mediaType === "youtube_channel" ? (() => {
              const videoId = extractYouTubeVideoId(post.mediaUrls[0]);
              
              if (videoId) {
                // It's a YouTube video - show thumbnail with play button
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                return (
                  <a 
                    href={post.mediaUrls[0]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block relative w-full rounded-lg overflow-hidden group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={thumbnailUrl}
                      alt="YouTube video thumbnail"
                      className="w-full h-auto bg-gray-900"
                      style={{ maxHeight: '500px', objectFit: 'cover' }}
                      onError={(e) => {
                        // Fallback to hqdefault if maxresdefault doesn't exist
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes('maxresdefault')) {
                          target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                        }
                      }}
                    />
                  </a>
                );
              } else {
                // It's a YouTube channel - show channel card
                return (
                  <a 
                    href={post.mediaUrls[0]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full rounded-lg bg-gradient-to-br from-red-900/20 to-gray-900 border border-red-900/30 hover:border-red-700/50 transition-all overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6 flex flex-col items-center gap-4">
                      <div className="bg-red-600 p-4 rounded-full">
                        <Youtube className="w-12 h-12 text-white" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-lg font-semibold text-white mb-2">YouTube Channel</h4>
                        <p className="text-sm text-gray-400 mb-3">Click to visit this exclusive channel</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors">
                          <Youtube className="w-4 h-4" />
                          <span className="font-medium">Open Channel</span>
                        </div>
                      </div>
                      <div className="w-full pt-3 border-t border-gray-800">
                        <p className="text-xs text-gray-500 truncate text-center">
                          {post.mediaUrls[0]}
                        </p>
                      </div>
                    </div>
                  </a>
                );
              }
            })() : post.mediaType === "video" ? (
              <video
                controls
                className="w-full rounded-lg bg-gray-900"
                style={{ maxHeight: '500px' }}
                poster={getImageUrl(post.mediaUrls[0])}
              >
                <source src={getImageUrl(post.mediaUrls[0])} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={getImageUrl(post.mediaUrls[0])}
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
                      <AvatarImage src={getImageUrl(comment.user?.profileImageUrl)} alt={comment.user?.firstName} />
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

      {/* Edit Post Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Title (Optional)</label>
              <Input
                value={editFormData.title}
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Add a title to your post..."
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Content *</label>
              <Textarea
                value={editFormData.content}
                onChange={(e) => setEditFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="What would you like to share?"
                rows={4}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                required
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Tags</label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={addTag}
                  className="bg-gray-700 hover:bg-gray-600"
                >
                  Add
                </Button>
              </div>
              {editFormData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editFormData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-gray-700 text-white flex items-center gap-1"
                    >
                      #{tag}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTag(tag)}
                        className="p-0 h-auto text-gray-400 hover:text-white ml-1"
                      >
                        <span className="text-xs">×</span>
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveEdit}
                disabled={editPostMutation.isPending}
                className="bg-[#D4AF37] text-black hover:bg-[#B8941F]"
              >
                {editPostMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}