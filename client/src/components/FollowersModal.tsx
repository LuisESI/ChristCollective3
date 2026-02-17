import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl, getImageUrl } from "@/lib/api-config";
import { UserPlus, UserMinus, Users, Sparkles } from "lucide-react";
import { Link } from "wouter";

interface FollowersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initialTab: "followers" | "following";
  currentUserId?: string;
  displayName?: string;
}

export function FollowersModal({ open, onOpenChange, userId, initialTab, currentUserId, displayName }: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following" | "suggestions">(initialTab);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: followers = [], isLoading: followersLoading } = useQuery<any[]>({
    queryKey: ["/api/users", userId, "followers"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(`/api/users/${userId}/followers`), { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open && !!userId,
  });

  const { data: following = [], isLoading: followingLoading } = useQuery<any[]>({
    queryKey: ["/api/users", userId, "following"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl(`/api/users/${userId}/following`), { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open && !!userId,
  });

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: open && activeTab === "suggestions",
  });

  const followingIds = new Set(following.map((u: any) => u.id));

  const suggestions = allUsers.filter((u: any) =>
    u.id !== currentUserId &&
    u.id !== userId &&
    !followingIds.has(u.id) &&
    u.username
  ).slice(0, 10);

  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const res = await fetch(buildApiUrl(`/api/users/${targetUserId}/follow`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to follow');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "following"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/stats`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/is-following`] });
      toast({ title: "Followed successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const res = await fetch(buildApiUrl(`/api/users/${targetUserId}/follow`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to unfollow');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "following"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/stats`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/is-following`] });
      toast({ title: "Unfollowed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const renderUserRow = (user: any, showFollowAction: boolean = true) => {
    const name = user.displayName
      ? user.displayName
      : user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.username || 'User';
    const isFollowingUser = followingIds.has(user.id);
    const isCurrentUser = user.id === currentUserId;

    return (
      <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-900 transition-colors">
        <Link href={user.username ? `/profile/${user.username}` : '#'} onClick={() => onOpenChange(false)}>
          <Avatar className="w-11 h-11 cursor-pointer">
            <AvatarImage src={getImageUrl(user.profileImageUrl)} />
            <AvatarFallback className="bg-[#D4AF37] text-black font-semibold">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={user.username ? `/profile/${user.username}` : '#'} onClick={() => onOpenChange(false)}>
            <p className="font-medium text-white text-sm truncate cursor-pointer hover:text-[#D4AF37]">{name}</p>
          </Link>
          <p className="text-xs text-gray-400 truncate">@{user.username || 'user'}</p>
        </div>
        {showFollowAction && currentUserId && !isCurrentUser && (
          <Button
            size="sm"
            onClick={() => {
              if (isFollowingUser) {
                unfollowMutation.mutate(user.id);
              } else {
                followMutation.mutate(user.id);
              }
            }}
            disabled={followMutation.isPending || unfollowMutation.isPending}
            className={
              isFollowingUser
                ? 'bg-gray-700 text-white hover:bg-red-600 text-xs px-3'
                : 'bg-[#D4AF37] text-black hover:bg-[#B8941F] text-xs px-3'
            }
          >
            {isFollowingUser ? (
              <>
                <UserMinus className="w-3 h-3 mr-1" />
                Unfollow
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3 mr-1" />
                Follow
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  const isLoading = activeTab === "followers" ? followersLoading : followingLoading;
  const list = activeTab === "followers" ? followers : activeTab === "following" ? following : suggestions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] bg-black border-gray-800 text-white p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-white text-lg">
            {displayName ? `${displayName}'s Connections` : 'Connections'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex border-b border-gray-800 px-4">
          <button
            onClick={() => setActiveTab("followers")}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
              activeTab === "followers"
                ? "text-[#D4AF37] border-b-2 border-[#D4AF37]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Followers ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
              activeTab === "following"
                ? "text-[#D4AF37] border-b-2 border-[#D4AF37]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Following ({following.length})
          </button>
          <button
            onClick={() => setActiveTab("suggestions")}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
              activeTab === "suggestions"
                ? "text-[#D4AF37] border-b-2 border-[#D4AF37]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            Discover
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div>
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                {activeTab === "followers"
                  ? "No followers yet"
                  : activeTab === "following"
                  ? "Not following anyone yet"
                  : "No suggestions available"}
              </p>
            </div>
          ) : (
            <div className="space-y-1 mt-2">
              {list.map((user: any) => renderUserRow(user, true))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
