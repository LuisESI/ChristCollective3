import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { MinistryPostCard } from "@/components/MinistryPostCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2, ChevronLeft, Send, Trash2, MessageCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isNativeApp } from "@/lib/platform";
import { getImageUrl } from "@/lib/api-config";
import { Share } from "@capacitor/share";
import { formatDistanceToNow } from "date-fns";

export default function EventPublicPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = parseInt(id);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [autoRsvpDone, setAutoRsvpDone] = useState(false);
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const { data: post, isLoading: postLoading } = useQuery<any>({
    queryKey: [`/api/events/${eventId}/post`],
    enabled: !!eventId,
  });

  const { data: event, isLoading: eventLoading } = useQuery<any>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  const { data: attendees = [] } = useQuery<any[]>({
    queryKey: [`/api/ministry-posts/${post?.id}/attendees`],
    enabled: !!post?.id,
  });

  const { data: comments = [] } = useQuery<any[]>({
    queryKey: [`/api/ministry-posts/${post?.id}/comments`],
    enabled: !!post?.id,
  });

  const rsvpMutation = useMutation({
    mutationFn: (status: string) =>
      apiRequest(`/api/ministry-posts/${post?.id}/rsvp`, { method: "POST", data: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post?.id}/rsvp`] });
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post?.id}/rsvps`] });
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post?.id}/attendees`] });
      toast({ title: "RSVP confirmed!", description: "You're on the guest list." });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest(`/api/ministry-posts/${post?.id}/comments`, { method: "POST", data: { content } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post?.id}/comments`] });
      setCommentText("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to post comment.", variant: "destructive" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) =>
      apiRequest(`/api/ministry-post-comments/${commentId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post?.id}/comments`] });
    },
  });

  // Auto-RSVP after login redirect
  useEffect(() => {
    if (!user || !post || autoRsvpDone) return;
    const pending = sessionStorage.getItem("pendingRsvp");
    if (!pending) return;
    try {
      const { postId, status } = JSON.parse(pending);
      if (postId === post.id) {
        sessionStorage.removeItem("pendingRsvp");
        setAutoRsvpDone(true);
        rsvpMutation.mutate(status);
      }
    } catch {
      sessionStorage.removeItem("pendingRsvp");
    }
  }, [user, post, autoRsvpDone]);

  const handleShare = async () => {
    const baseUrl = isNativeApp() ? "https://christcollective.com" : window.location.origin;
    const url = `${baseUrl}/events/${eventId}`;
    try {
      if (isNativeApp()) {
        await Share.share({ title: event?.title || "Event", text: `Join us at ${event?.title || "this event"}!`, url });
      } else if (navigator.share) {
        await navigator.share({ title: event?.title || "Event", text: `Join us at ${event?.title || "this event"}!`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied!", description: "Share this link with anyone." });
      }
    } catch { /* cancelled */ }
  };

  const handleSubmitComment = () => {
    const text = commentText.trim();
    if (!text) return;
    if (!user) {
      const redirect = encodeURIComponent(`/events/${eventId}`);
      navigate(isNativeApp() ? `/auth/mobile?redirect=${redirect}` : `/auth?redirect=${redirect}`);
      return;
    }
    addCommentMutation.mutate(text);
  };

  const isLoading = postLoading || eventLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post || !event) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-white text-lg font-semibold">Event not found</p>
        <Button variant="ghost" className="text-[#D4AF37]" onClick={() => navigate("/")}>
          Go home
        </Button>
      </div>
    );
  }

  const goingAttendees = attendees.filter((a) => a.status === "going");
  const maybeAttendees = attendees.filter((a) => a.status === "maybe");

  const displayName = (a: any) =>
    a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : a.username || "Member";

  const initials = (a: any) =>
    (a.firstName?.[0] || a.username?.[0] || "?").toUpperCase();

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-4 py-3">
        <button
          onClick={() => (window.history.length > 1 ? window.history.back() : navigate("/"))}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-[#D4AF37] hover:text-[#B8941F] transition-colors text-sm font-medium"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Event card (flat layout) */}
        <MinistryPostCard
          post={post}
          flatLayout={true}
          disableClick={true}
          onUnauthenticatedRsvp={(status) => {
            sessionStorage.setItem("pendingRsvp", JSON.stringify({ postId: post.id, status }));
            const redirect = encodeURIComponent(`/events/${eventId}`);
            navigate(isNativeApp() ? `/auth/mobile?redirect=${redirect}` : `/auth?redirect=${redirect}`);
          }}
        />

        {/* Sign-up CTA for unauthenticated users */}
        {!user && (
          <div className="px-4 pb-4 pt-2">
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-5 text-center">
              <p className="text-white font-semibold mb-1">Want to RSVP or comment?</p>
              <p className="text-gray-400 text-sm mb-4">Create a free account or sign in to join the conversation.</p>
              <Button
                className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold"
                onClick={() => {
                  const redirect = encodeURIComponent(`/events/${eventId}`);
                  navigate(isNativeApp() ? `/auth/mobile?redirect=${redirect}` : `/auth?redirect=${redirect}`);
                }}
              >
                Sign In / Sign Up
              </Button>
            </div>
          </div>
        )}

        {/* ── Attendees section ── */}
        {attendees.length > 0 && (
          <div className="px-4 pb-4">
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-[#D4AF37]" />
                <h2 className="text-white font-semibold text-sm">
                  Who's Coming
                  <span className="text-gray-500 font-normal ml-1">
                    ({attendees.length} {attendees.length === 1 ? "person" : "people"})
                  </span>
                </h2>
              </div>

              {/* Going */}
              {goingAttendees.length > 0 && (
                <div className="mb-4">
                  <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wide mb-2">🙌 Going</p>
                  <div className="flex gap-3 flex-wrap">
                    {goingAttendees.map((a) => (
                      <div key={a.userId} className="flex flex-col items-center gap-1 w-14">
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-[#D4AF37]/60">
                            <AvatarImage src={getImageUrl(a.profileImageUrl)} />
                            <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold">
                              {initials(a)}
                            </AvatarFallback>
                          </Avatar>
                          {(a.plusOnes ?? 0) > 0 && (
                            <span className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                              +{a.plusOnes}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 text-[10px] text-center leading-tight truncate w-full">
                          {displayName(a).split(" ")[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Maybe */}
              {maybeAttendees.length > 0 && (
                <div>
                  <p className="text-blue-400 text-xs font-semibold uppercase tracking-wide mb-2">🤔 Maybe</p>
                  <div className="flex gap-3 flex-wrap">
                    {maybeAttendees.map((a) => (
                      <div key={a.userId} className="flex flex-col items-center gap-1 w-14">
                        <Avatar className="h-12 w-12 border-2 border-blue-400/40 opacity-75">
                          <AvatarImage src={getImageUrl(a.profileImageUrl)} />
                          <AvatarFallback className="bg-blue-900/40 text-blue-300 text-xs font-bold">
                            {initials(a)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-500 text-[10px] text-center leading-tight truncate w-full">
                          {displayName(a).split(" ")[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Comments section ── */}
        <div className="px-4 pb-4">
          <div className="bg-[#0A0A0A] border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-gray-800">
              <MessageCircle className="h-4 w-4 text-[#D4AF37]" />
              <h2 className="text-white font-semibold text-sm">
                Comments
                {comments.length > 0 && (
                  <span className="text-gray-500 font-normal ml-1">({comments.length})</span>
                )}
              </h2>
            </div>

            {/* Comment list */}
            <div className="divide-y divide-gray-800/50">
              {comments.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500 text-sm">No comments yet.</p>
                  <p className="text-gray-600 text-xs mt-1">Be the first to say something!</p>
                </div>
              ) : (
                comments.map((c: any) => {
                  const isOwn = user && c.userId === (user as any).id;
                  const name = c.firstName && c.lastName
                    ? `${c.firstName} ${c.lastName}`
                    : c.username || "Member";
                  const initials = (c.firstName?.[0] || c.username?.[0] || "?").toUpperCase();
                  const timeAgo = c.createdAt
                    ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })
                    : "";

                  return (
                    <div key={c.id} className="flex gap-3 p-4">
                      <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                        <AvatarImage src={getImageUrl(c.profileImageUrl)} />
                        <AvatarFallback className="bg-gray-800 text-gray-300 text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-white text-sm font-semibold truncate">{name}</span>
                            <span className="text-gray-500 text-[11px] flex-shrink-0">{timeAgo}</span>
                          </div>
                          {isOwn && (
                            <button
                              onClick={() => deleteCommentMutation.mutate(c.id)}
                              disabled={deleteCommentMutation.isPending}
                              className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm mt-0.5 break-words leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment input */}
            <div className="p-3 border-t border-gray-800 bg-black/40">
              {user ? (
                <div className="flex gap-2 items-end">
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarImage src={getImageUrl((user as any).profileImageUrl)} />
                    <AvatarFallback className="bg-[#D4AF37] text-black text-[10px] font-bold">
                      {((user as any).firstName?.[0] || (user as any).username?.[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex items-end gap-2 bg-gray-900 rounded-2xl px-3 py-2">
                    <textarea
                      ref={commentInputRef}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitComment();
                        }
                      }}
                      placeholder="Add a comment…"
                      rows={1}
                      className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none resize-none max-h-24 leading-relaxed"
                      style={{ fieldSizing: "content" } as any}
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || addCommentMutation.isPending}
                      className="text-[#D4AF37] disabled:opacity-30 hover:text-[#B8941F] transition-colors flex-shrink-0 pb-0.5"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const redirect = encodeURIComponent(`/events/${eventId}`);
                    navigate(isNativeApp() ? `/auth/mobile?redirect=${redirect}` : `/auth?redirect=${redirect}`);
                  }}
                  className="w-full text-center text-gray-500 text-sm py-2 hover:text-gray-300 transition-colors"
                >
                  Sign in to comment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
