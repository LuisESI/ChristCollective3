import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { buildApiUrl, getImageUrl, getProfileImageUrl } from "@/lib/api-config";
import { getUserDisplayName as getDisplayName, getUserInitials as getInitials } from "@/lib/user-display";
import { MoreHorizontal, Calendar, Trash2, Youtube, Edit, Flag, ChevronLeft, ChevronRight, UserMinus } from "lucide-react";
import { Heart, ChatCircle, ShareNetwork, BookmarkSimple, PaperPlaneTilt } from "@phosphor-icons/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useAuthGuard } from "@/lib/auth-guard";
import { renderContentWithMentions } from "@/components/MentionTextarea";

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
  const [isSaved, setIsSaved] = useState(false);

  const { data: likedData } = useQuery({
    queryKey: ["/api/platform-posts", post.id, "liked"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl(`/api/platform-posts/${post.id}/liked`), {
        credentials: 'include',
      });
      if (!response.ok) return { liked: false };
      return response.json();
    },
    enabled: !!currentUserId,
  });

  useEffect(() => {
    if (likedData) {
      setIsLiked(likedData.liked);
    }
  }, [likedData]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const [carouselIndex, setCarouselIndex] = useState(0);
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

  // Check if post is saved by current user
  const { data: savedData } = useQuery({
    queryKey: ["/api/platform-posts", post.id, "saved"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl(`/api/platform-posts/${post.id}/saved`), {
        credentials: 'include',
      });
      if (!response.ok) return { saved: false };
      return response.json();
    },
    enabled: !!currentUserId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/platform-posts/${post.id}/save`, {
        method: "POST",
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      setIsSaved(data.saved);
      queryClient.invalidateQueries({ queryKey: ["/api/platform-posts", post.id, "saved"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (savedData?.saved !== undefined) {
      setIsSaved(savedData.saved);
    }
  }, [savedData?.saved, post.id]);

  const handleSave = () => {
    requireAuth(() => {
      saveMutation.mutate();
    }, "Please sign in to save posts");
  };

  const reportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/platform-posts/${post.id}/report`, {
        method: "POST",
        data: { reason: reportReason, details: reportDetails },
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Thank you for reporting this post. Our team will review it shortly.",
      });
      setShowReportModal(false);
      setReportReason("");
      setReportDetails("");
      queryClient.invalidateQueries({ queryKey: ["/api/platform-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/explore"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: (error: any) => {
      toast({
        title: "Report Failed",
        description: error.message || "Could not submit report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/users/${post.userId}/block`, { method: "POST" });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User Blocked",
        description: "You will no longer see posts from this user.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/explore"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not block user. Please try again.", variant: "destructive" });
    },
  });

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
      const res = await apiRequest(`/api/platform-posts/${post.id}/like`, {
        method: "POST",
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      setIsLiked(data.liked);
      setLikesCount(data.likesCount);
      queryClient.invalidateQueries({ queryKey: ["/api/platform-posts", post.id, "liked"] });
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
      const msg = error.message || "";
      let description = msg;
      if (msg.includes("community guidelines")) {
        description = "Your comment contains content that violates our community guidelines.";
      } else if (msg.includes("400:")) {
        try {
          const jsonStr = msg.substring(msg.indexOf("{"));
          const parsed = JSON.parse(jsonStr);
          description = parsed.message || description;
        } catch {
          // use original
        }
      }
      toast({
        title: "Comment not allowed",
        description,
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
    return getProfileImageUrl(postAuthor?.profileImageUrl, 80);
  };

  const getUserInitials = () => {
    const initials = getInitials(postAuthor);
    if (initials !== "U") return initials;
    if (post.authorType) return post.authorType.charAt(0).toUpperCase();
    return "U";
  };

  const getUserDisplayName = () => {
    const name = getDisplayName(postAuthor);
    if (name !== "User") return name;
    return getAuthorDisplayName();
  };

  const getUserUsername = () => {
    return postAuthor?.username || post.userId || "username";
  };

  const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handlePostClick = (e: React.MouseEvent) => {
    if (disablePostClick || (e.target as HTMLElement).closest('button, input, textarea, a')) return;
    window.location.href = `/post/${post.id}`;
  };

  return (
    <div
      className={`border-b border-gray-800/60 px-4 pt-3 pb-1 ${!disablePostClick ? 'cursor-pointer active:bg-white/[0.02]' : ''}`}
      onClick={handlePostClick}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Link
          href={`/profile/${getUserUsername()}`}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          className="flex-shrink-0 mt-0.5"
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={getUserProfileImage()} alt="Profile" />
            <AvatarFallback className="bg-[#D4AF37] text-black text-sm font-bold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header: name · handle · time · menu */}
          <div className="flex items-start justify-between gap-1 mb-0.5">
            <Link
              href={`/profile/${getUserUsername()}`}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="flex flex-wrap items-baseline gap-x-1 min-w-0"
            >
              <span className="font-bold text-white text-[15px] leading-snug">{getUserDisplayName()}</span>
              <span className="text-gray-500 text-[14px] truncate">@{getUserUsername()}</span>
              <span className="text-gray-600 text-[14px]">·</span>
              <span className="text-gray-500 text-[14px] flex-shrink-0">{formatRelativeTime(post.createdAt)}</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex-shrink-0 text-gray-500 hover:text-white p-1 -mr-1 rounded-full hover:bg-white/[0.08] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                {currentUserId && post.userId === currentUserId && (
                  <>
                    <DropdownMenuItem
                      className="text-gray-300 hover:text-white hover:bg-gray-800"
                      onClick={(e) => { e.stopPropagation(); handleEditPost(); }}
                    >
                      <Edit className="w-4 h-4 mr-2" />Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      onClick={(e) => { e.stopPropagation(); handleDeletePost(); }}
                      disabled={deletePostMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />Delete Post
                    </DropdownMenuItem>
                  </>
                )}
                {currentUserId && post.userId !== currentUserId && (
                  <>
                    <DropdownMenuItem
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      onClick={(e) => { e.stopPropagation(); requireAuth(() => setShowReportModal(true), "Please sign in to report posts"); }}
                    >
                      <Flag className="w-4 h-4 mr-2" />Report Post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-orange-400 hover:text-orange-300 hover:bg-orange-900/20"
                      onClick={(e) => { e.stopPropagation(); requireAuth(() => blockUserMutation.mutate(), "Please sign in to block users"); }}
                      disabled={blockUserMutation.isPending}
                    >
                      <UserMinus className="w-4 h-4 mr-2" />Block User
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title */}
          {post.title && (
            <p className="font-semibold text-white text-[15px] mb-1">{post.title}</p>
          )}

          {/* Content */}
          <p className="text-[15px] text-[#e7e9ea] leading-snug mb-3 whitespace-pre-wrap break-words">
            {renderContentWithMentions(post.content)}
          </p>

          {/* Media */}
          {post.mediaUrls && post.mediaUrls.length > 0 && post.mediaType !== "text" && (
            <div className="mb-3 rounded-2xl overflow-hidden border border-gray-800">
              {post.mediaType === "youtube_channel" ? (() => {
                const videoId = extractYouTubeVideoId(post.mediaUrls[0]);
                if (videoId) {
                  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                  return (
                    <a href={post.mediaUrls[0]} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                      <img
                        src={thumbnailUrl}
                        alt="YouTube video thumbnail"
                        className="w-full h-auto bg-gray-900"
                        style={{ maxHeight: '500px', objectFit: 'cover' }}
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          if (t.src.includes('maxresdefault')) t.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                        }}
                      />
                    </a>
                  );
                }
                return (
                  <a href={post.mediaUrls[0]} target="_blank" rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-br from-red-900/20 to-gray-900 hover:from-red-900/30 transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6 flex flex-col items-center gap-4">
                      <div className="bg-red-600 p-4 rounded-full"><Youtube className="w-12 h-12 text-white" /></div>
                      <div className="text-center">
                        <h4 className="text-lg font-semibold text-white mb-2">YouTube Channel</h4>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full">
                          <Youtube className="w-4 h-4" /><span className="font-medium">Open Channel</span>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })() : post.mediaType === "video" ? (
                <video controls className="w-full bg-gray-900" style={{ maxHeight: '500px' }} poster={getImageUrl(post.mediaUrls[0])}>
                  <source src={getImageUrl(post.mediaUrls[0])} type="video/mp4" />
                </video>
              ) : post.mediaUrls.length > 1 ? (
                <div className="relative w-full bg-gray-900">
                  <img
                    src={getImageUrl(post.mediaUrls[carouselIndex])}
                    alt={`${post.title || "Post"} ${carouselIndex + 1}/${post.mediaUrls.length}`}
                    className="w-full object-cover"
                    style={{ maxHeight: '500px', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <button onClick={(e) => { e.stopPropagation(); setCarouselIndex(i => (i - 1 + post.mediaUrls!.length) % post.mediaUrls!.length); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setCarouselIndex(i => (i + 1) % post.mediaUrls!.length); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {post.mediaUrls.map((_, i) => (
                      <button key={i} onClick={(e) => { e.stopPropagation(); setCarouselIndex(i); }}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === carouselIndex ? 'bg-[#D4AF37]' : 'bg-white/50'}`} />
                    ))}
                  </div>
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    {carouselIndex + 1}/{post.mediaUrls.length}
                  </div>
                </div>
              ) : (
                <img
                  src={getImageUrl(post.mediaUrls[0])}
                  alt={post.title || "Post media"}
                  className="w-full bg-gray-900"
                  style={{ maxHeight: '500px', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-x-2 mb-2">
              {post.tags.map((tag, i) => (
                <span key={i} className="text-[#D4AF37] text-sm">#{tag}</span>
              ))}
            </div>
          )}

          {/* Action bar */}
          {showActions && (
            <div className="flex items-center justify-between mt-1 -mx-1.5 py-0.5">
              <button
                className="flex items-center gap-1 text-gray-500 hover:text-[#1d9bf0] group press-effect"
                onClick={(e) => { e.stopPropagation(); requireAuth(() => setShowComments(!showComments), "Please sign in to view and add comments"); }}
                data-testid="button-comment"
              >
                <span className="p-1.5 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                  <ChatCircle size={18} />
                </span>
                {post.commentsCount > 0 && <span className="text-xs tabular-nums">{post.commentsCount}</span>}
              </button>

              <button
                className={`flex items-center gap-1 group press-effect ${isLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'}`}
                onClick={(e) => { e.stopPropagation(); handleLike(); }}
                disabled={likeMutation.isPending}
                data-testid="button-like"
              >
                <span className="p-1.5 rounded-full group-hover:bg-pink-500/10 transition-colors">
                  <Heart size={18} weight={isLiked ? "fill" : "regular"} />
                </span>
                {likesCount > 0 && <span className="text-xs tabular-nums">{likesCount}</span>}
              </button>

              <button
                className="flex items-center gap-1 text-gray-500 hover:text-[#1d9bf0] group press-effect"
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                data-testid="button-share"
              >
                <span className="p-1.5 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                  <ShareNetwork size={18} />
                </span>
                {post.sharesCount > 0 && <span className="text-xs tabular-nums">{post.sharesCount}</span>}
              </button>

              <button
                className={`p-1.5 rounded-full transition-colors press-effect ${isSaved ? 'text-[#D4AF37]' : 'text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'}`}
                onClick={(e) => { e.stopPropagation(); handleSave(); }}
                disabled={saveMutation.isPending}
                data-testid="button-save"
              >
                <BookmarkSimple size={18} weight={isSaved ? "fill" : "regular"} />
              </button>
            </div>
          )}

          {/* Comments */}
          {(showComments || expandComments) && (
            <div className="space-y-3 pt-3 border-t border-gray-800 mt-2">
              {Array.isArray(comments) && comments.length > 0 && (
                <div className="space-y-3 mb-3">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-2 items-start group">
                      <Avatar className="w-7 h-7 flex-shrink-0">
                        <AvatarImage src={getProfileImageUrl(comment.user?.profileImageUrl, 56)} alt={comment.user?.firstName} />
                        <AvatarFallback className="bg-gray-700 text-gray-300 text-xs">
                          {comment.user?.firstName?.[0] || comment.user?.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-white text-sm">
                          {comment.user?.firstName || comment.user?.username || "User"}
                        </span>
                        <span className="text-gray-300 text-sm ml-2">{comment.content}</span>
                      </div>
                      {currentUserId && comment.userId === currentUserId && (
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1"
                          onClick={(e) => { e.stopPropagation(); handleDeleteComment(comment.id); }}
                          disabled={deleteCommentMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {currentUserId && (
                <div className="flex gap-2 items-center pb-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={1}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 text-sm resize-none h-8 min-h-[32px] max-h-[32px] py-1 rounded-full px-4"
                  />
                  <Button
                    onClick={handleComment}
                    disabled={commentMutation.isPending || !newComment.trim()}
                    className="bg-[#D4AF37] text-black hover:bg-[#B8941F] h-8 w-8 p-0 flex items-center justify-center rounded-full"
                  >
                    <PaperPlaneTilt size={14} weight="fill" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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

      {/* Report Post Modal */}
      <Dialog open={showReportModal} onOpenChange={(open) => {
        setShowReportModal(open);
        if (!open) {
          setReportReason("");
          setReportDetails("");
        }
      }}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-400" />
              Report Post
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Help us keep the community safe. Select a reason for reporting this post.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <RadioGroup value={reportReason} onValueChange={setReportReason} className="space-y-2">
              {[
                { value: "spam", label: "Spam" },
                { value: "harassment", label: "Harassment or Bullying" },
                { value: "hate_speech", label: "Hate Speech" },
                { value: "violence", label: "Violence or Threats" },
                { value: "nudity", label: "Nudity or Sexual Content" },
                { value: "false_information", label: "False Information" },
                { value: "scam", label: "Scam or Fraud" },
                { value: "inappropriate", label: "Inappropriate Content" },
                { value: "other", label: "Other" },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors">
                  <RadioGroupItem value={option.value} id={`report-${option.value}`} className="border-gray-600 text-[#D4AF37]" />
                  <Label htmlFor={`report-${option.value}`} className="text-gray-300 cursor-pointer flex-1">{option.label}</Label>
                </div>
              ))}
            </RadioGroup>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-white">Additional Details (Optional)</Label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide any additional context..."
                rows={3}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                maxLength={500}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReportModal(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => reportMutation.mutate()}
                disabled={!reportReason || reportMutation.isPending}
                className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {reportMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}