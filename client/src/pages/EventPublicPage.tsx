import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { MinistryPostCard } from "@/components/MinistryPostCard";
import { Button } from "@/components/ui/button";
import { Share2, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isNativeApp } from "@/lib/platform";

export default function EventPublicPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = parseInt(id);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [autoRsvpDone, setAutoRsvpDone] = useState(false);

  const { data: post, isLoading: postLoading } = useQuery<any>({
    queryKey: [`/api/events/${eventId}/post`],
    enabled: !!eventId,
  });

  const { data: event, isLoading: eventLoading } = useQuery<any>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  const rsvpMutation = useMutation({
    mutationFn: (status: string) =>
      apiRequest(`/api/ministry-posts/${post?.id}/rsvp`, { method: "POST", data: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post?.id}/rsvp`] });
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post?.id}/rsvps`] });
      toast({ title: "RSVP confirmed!", description: "You're on the guest list." });
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
    const url = `${window.location.origin}/events/${eventId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title || "Event",
          text: `Join us at ${event?.title || "this event"}!`,
          url,
        });
      } catch {
        // user cancelled share sheet
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share this link with anyone." });
    }
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

  return (
    <div className="min-h-screen bg-black">
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

      {/* Event card (flat layout) */}
      <div className="max-w-lg mx-auto">
        <MinistryPostCard
          post={post}
          flatLayout={true}
          disableClick={true}
          onUnauthenticatedRsvp={(status) => {
            sessionStorage.setItem("pendingRsvp", JSON.stringify({ postId: post.id, status }));
            const redirect = encodeURIComponent(`/events/${eventId}`);
            if (isNativeApp()) {
              navigate(`/auth/mobile?redirect=${redirect}`);
            } else {
              navigate(`/auth?redirect=${redirect}`);
            }
          }}
        />
      </div>

      {/* Sign-up CTA for unauthenticated users */}
      {!user && (
        <div className="max-w-lg mx-auto px-4 pb-8 pt-2">
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-5 text-center">
            <p className="text-white font-semibold mb-1">Want to RSVP?</p>
            <p className="text-gray-400 text-sm mb-4">Create a free account or sign in to save your spot.</p>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold"
                onClick={() => {
                  const redirect = encodeURIComponent(`/events/${eventId}`);
                  navigate(isNativeApp() ? `/auth/mobile?redirect=${redirect}` : `/auth?redirect=${redirect}`);
                }}
              >
                Sign In / Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
