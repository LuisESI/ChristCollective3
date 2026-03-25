import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Clock, Church, ExternalLink, Crown, X, Video, Globe, MoreHorizontal, Pencil, Trash2, Share2 } from "lucide-react";
import { isNativeApp } from "@/lib/platform";
import { MinistryPost } from "@shared/schema";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useAuthGuard } from "@/lib/auth-guard";
import { getImageUrl } from "@/lib/api-config";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface MinistryPostCardProps {
  post: MinistryPost & {
    ministry?: {
      id: number;
      name: string;
      logo?: string;
      denomination?: string;
    };
  };
  disableClick?: boolean;
  flatLayout?: boolean;
  onUnauthenticatedRsvp?: (status: string) => void;
}

function formatEventDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatEventDateRange(start: string | Date | null | undefined, end: string | Date | null | undefined): string {
  const startStr = formatEventDate(start);
  if (!end) return startStr;
  const endD = new Date(end as string);
  if (isNaN(endD.getTime())) return startStr;
  const endStr = endD.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${startStr} — ${endStr}`;
}

export function MinistryPostCard({ post, disableClick = false, flatLayout = false, onUnauthenticatedRsvp }: MinistryPostCardProps) {
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>("going");
  const [pendingPlusOnes, setPendingPlusOnes] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const queryClient = useQueryClient();
  const { requireAuth } = useAuthGuard();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const isEventPost = post.type === 'event_announcement';
  const eventId = (post as any).eventId as number | null | undefined;

  // Check if current user owns this ministry
  const { data: myMinistry } = useQuery<any>({
    queryKey: ["/api/user/ministry-profile"],
    enabled: isAuthenticated && isEventPost,
  });
  const isOwner = isAuthenticated && !!myMinistry && myMinistry.id === post.ministry?.id;

  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      if (!myMinistry?.id || !eventId) throw new Error("Cannot delete");
      return apiRequest(`/api/ministries/${myMinistry.id}/events/${eventId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({ title: "Event deleted", description: "The event has been deleted." });
      queryClient.invalidateQueries({ queryKey: ["/api/ministries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ministry-posts"] });
      navigate("/profile");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete event.", variant: "destructive" });
    },
  });

  // Fetch linked event details if eventId exists
  const { data: eventData } = useQuery<any>({
    queryKey: [`/api/events/${eventId}`],
    enabled: isEventPost && !!eventId,
  });

  // RSVP state for this post
  const { data: userRsvp } = useQuery<any>({
    queryKey: [`/api/ministry-posts/${post.id}/rsvp`],
    enabled: isEventPost && isAuthenticated,
  });

  const { data: rsvpCounts } = useQuery<any[]>({
    queryKey: [`/api/ministry-posts/${post.id}/rsvps`],
    enabled: isEventPost,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ status, notes, plusOnes }: { status: string; notes?: string; plusOnes?: number }) => {
      return apiRequest(`/api/ministry-posts/${post.id}/rsvp`, {
        method: 'POST',
        data: { status, notes, plusOnes: plusOnes ?? 0 }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post.id}/rsvp`] });
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post.id}/rsvps`] });
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post.id}/attendees`] });
    }
  });

  const removeRsvpMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/ministry-posts/${post.id}/rsvp`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post.id}/rsvp`] });
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post.id}/rsvps`] });
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post.id}/attendees`] });
    }
  });

  const handleRsvp = (status: string) => {
    if (!isAuthenticated) {
      if (onUnauthenticatedRsvp) {
        onUnauthenticatedRsvp(status);
      } else {
        requireAuth(() => {}, "Please sign in to RSVP for events");
      }
      return;
    }
    // Open modal with this status pre-selected; seed plus ones from existing RSVP
    setPendingStatus(status);
    setPendingPlusOnes(userRsvp?.plusOnes ?? 0);
    setShowRsvpModal(true);
  };

  const confirmRsvp = () => {
    if (userRsvp?.status === pendingStatus && (userRsvp?.plusOnes ?? 0) === pendingPlusOnes) {
      // No change — treat as un-RSVP toggle
      removeRsvpMutation.mutate();
    } else {
      rsvpMutation.mutate({ status: pendingStatus, plusOnes: pendingPlusOnes });
    }
    setShowRsvpModal(false);
  };

  const shareEvent = async () => {
    const url = `${window.location.origin}/events/${eventId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: cleanTitle, text: `Join us at ${cleanTitle}!`, url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share this link with anyone." });
    }
  };

  const getRsvpCount = (status: string) =>
    Array.isArray(rsvpCounts) ? rsvpCounts.find((r: any) => r.status === status)?.count || 0 : 0;

  const getGoingTotal = () => {
    if (!Array.isArray(rsvpCounts)) return 0;
    const row = rsvpCounts.find((r: any) => r.status === 'going');
    if (!row) return 0;
    return (row.count || 0) + (row.totalGuests || 0);
  };

  const goingCount = getRsvpCount('going');
  const goingTotal = getGoingTotal();

  // Determine event date to display
  const displayDate = eventData
    ? formatEventDateRange(eventData.startDate, eventData.endDate)
    : formatEventDate(post.createdAt);

  // Location from event data
  const location = eventData?.location || eventData?.address || null;
  const isOnline = eventData?.isOnline;
  const onlineLink = eventData?.onlineLink;

  // Clean title
  const cleanTitle = (post.title || '').replace(/^New Event:\s*/i, '');

  const hasImage = post.mediaUrls && post.mediaUrls.length > 0;

  // ─── RSVP modal ───────────────────────────────────────────────────────────
  const RsvpModal = () => (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
      onClick={() => setShowRsvpModal(false)}
    >
      <div
        className="w-full max-w-md bg-[#111] rounded-t-3xl p-6 pb-28"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <div className="flex justify-end mb-2">
          <button onClick={() => setShowRsvpModal(false)} className="text-gray-500 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-white text-lg font-bold text-center mb-1">{cleanTitle}</h3>
        <p className="text-gray-500 text-xs text-center mb-6">Confirm your attendance</p>

        {/* Going / Maybe circles */}
        <div className="flex justify-center gap-8 mb-6">
          {/* Going */}
          <button
            onClick={() => setPendingStatus('going')}
            className={`flex flex-col items-center gap-2 transition-all ${
              pendingStatus === 'going' ? 'scale-110' : 'opacity-60 hover:opacity-80'
            }`}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl border-2 transition-all ${
              pendingStatus === 'going'
                ? 'bg-[#D4AF37]/20 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                : 'bg-gray-800 border-gray-700'
            }`}>
              🙌
            </div>
            <span className={`text-sm font-semibold ${pendingStatus === 'going' ? 'text-[#D4AF37]' : 'text-gray-400'}`}>Going</span>
          </button>

          {/* Maybe */}
          <button
            onClick={() => setPendingStatus('maybe')}
            className={`flex flex-col items-center gap-2 transition-all ${
              pendingStatus === 'maybe' ? 'scale-110' : 'opacity-60 hover:opacity-80'
            }`}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl border-2 transition-all ${
              pendingStatus === 'maybe'
                ? 'bg-blue-900/40 border-blue-400 shadow-lg'
                : 'bg-gray-800 border-gray-700'
            }`}>
              🤔
            </div>
            <span className={`text-sm font-semibold ${pendingStatus === 'maybe' ? 'text-blue-300' : 'text-gray-400'}`}>Maybe</span>
          </button>
        </div>

        {/* Plus ones stepper */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-5 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-semibold">Extra guests</p>
              <p className="text-gray-500 text-xs mt-0.5">How many people are you bringing?</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPendingPlusOnes(Math.max(0, pendingPlusOnes - 1))}
                disabled={pendingPlusOnes === 0}
                className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-white font-bold text-lg disabled:opacity-30 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"
              >
                −
              </button>
              <span className="text-white font-bold text-xl w-6 text-center">{pendingPlusOnes}</span>
              <button
                onClick={() => setPendingPlusOnes(Math.min(9, pendingPlusOnes + 1))}
                disabled={pendingPlusOnes === 9}
                className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-white font-bold text-lg disabled:opacity-30 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"
              >
                +
              </button>
            </div>
          </div>
          {pendingPlusOnes > 0 && (
            <p className="text-[#D4AF37] text-xs mt-3 text-center">
              You + {pendingPlusOnes} guest{pendingPlusOnes > 1 ? 's' : ''} = {1 + pendingPlusOnes} total
            </p>
          )}
        </div>

        {/* RSVP as */}
        {user && (
          <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3 mb-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={getImageUrl((user as any).profileImageUrl)} />
              <AvatarFallback className="bg-[#D4AF37] text-black text-xs font-bold">
                {((user as any).firstName?.[0] || (user as any).username?.[0] || 'U').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">RSVP as</p>
              <p className="text-white text-sm font-medium">
                {(user as any).firstName && (user as any).lastName
                  ? `${(user as any).firstName} ${(user as any).lastName}`
                  : (user as any).username || 'You'}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {userRsvp?.status && (
            <Button
              variant="outline"
              className="flex-1 border-gray-700 text-gray-400 hover:text-white h-12 rounded-xl"
              onClick={() => { removeRsvpMutation.mutate(); setShowRsvpModal(false); }}
            >
              Remove RSVP
            </Button>
          )}
          <Button
            className="flex-1 bg-[#D4AF37] text-black font-bold hover:bg-[#B8941F] h-12 rounded-xl"
            onClick={confirmRsvp}
          >
            {pendingStatus === 'going' ? '🙌 Confirm' : '🤔 Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );

  // ─── Shared delete confirmation dialog ────────────────────────────────────
  const DeleteDialog = () => (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent className="bg-[#111] border-gray-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Delete Event</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Are you sure you want to delete this event? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-800">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => deleteEventMutation.mutate()}
            disabled={deleteEventMutation.isPending}
          >
            {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ─── Owner action menu ─────────────────────────────────────────────────────
  const OwnerMenu = ({ className = "" }: { className?: string }) => (
    isOwner && eventId ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 ${className}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-gray-700">
          <DropdownMenuItem
            className="text-white hover:bg-white/10 cursor-pointer gap-2"
            onClick={() => navigate(`/events/${eventId}/edit`)}
          >
            <Pencil className="h-4 w-4 text-[#D4AF37]" />
            Edit Event
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-400 hover:bg-white/10 cursor-pointer gap-2"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete Event
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null
  );

  // ─── EVENT PREVIEW CARD (feed) ─────────────────────────────────────────────
  if (isEventPost && !flatLayout) {
    const handleCardClick = () => {
      navigate(eventId ? `/events/${eventId}` : `/ministry-post/${post.id}`);
    };

    return (
      <>
        <DeleteDialog />
        <div
          className="bg-[#0A0A0A] rounded-2xl overflow-hidden border border-gray-800 cursor-pointer active:scale-[0.99] transition-transform"
          onClick={handleCardClick}
        >
          {/* Image */}
          {hasImage && (
            <div className="relative">
              <img
                src={getImageUrl(post.mediaUrls![0])}
                alt="Event"
                className="w-full object-cover max-h-[400px]"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              {/* Gradient overlay bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              {/* Ministry pill top-left */}
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={getImageUrl(post.ministry?.logo)} />
                  <AvatarFallback className="bg-[#D4AF37] text-black text-[10px]">
                    <Church className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-white text-xs font-medium">{post.ministry?.name || 'Ministry'}</span>
              </div>
              {/* Event badge + owner menu top-right */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Badge className="bg-[#D4AF37] text-black text-xs font-semibold">Event</Badge>
                <OwnerMenu className="bg-black/60 backdrop-blur-sm rounded-full" />
              </div>
              {/* Date chip bottom-left over gradient */}
              {displayDate && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <Calendar className="h-3 w-3 text-[#D4AF37]" />
                  <span className="text-[#D4AF37] text-xs font-semibold">{displayDate}</span>
                </div>
              )}
              {/* Going count bottom-right */}
              {goingTotal > 0 && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <span className="text-white text-xs">🙌</span>
                  <span className="text-white text-xs font-medium">{goingTotal} going</span>
                </div>
              )}
            </div>
          )}

          {/* No image: ministry header row */}
          {!hasImage && (
            <div className="flex items-center gap-3 p-4 pb-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={getImageUrl(post.ministry?.logo)} />
                <AvatarFallback className="bg-[#D4AF37] text-black">
                  <Church className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">{post.ministry?.name || 'Ministry'}</p>
                <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30 text-[10px] mt-0.5">Event</Badge>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <OwnerMenu />
              </div>
            </div>
          )}

          <div className="p-4 space-y-2">
            <h2 className="text-white text-xl font-bold leading-tight">{cleanTitle || post.title}</h2>

            {/* Date row (no-image only) */}
            {!hasImage && displayDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#D4AF37] flex-shrink-0" />
                <span className="text-[#D4AF37] text-sm font-medium">{displayDate}</span>
              </div>
            )}

            {/* Location */}
            {isOnline ? (
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">Online Event</span>
              </div>
            ) : location ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{location}</span>
              </div>
            ) : null}

            {/* No-image going count */}
            {!hasImage && goingTotal > 0 && (
              <p className="text-gray-500 text-xs">🙌 {goingTotal} going</p>
            )}

            {/* Tap cue */}
            <div className="pt-1 border-t border-gray-800/60 flex items-center justify-between">
              <span className="text-gray-500 text-xs">Tap to see details & RSVP</span>
              <span className="text-[#D4AF37] text-xs font-medium">View →</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── FLAT / DETAIL LAYOUT (PostPage) ──────────────────────────────────────
  if (isEventPost && flatLayout) {
    return (
      <>
        {showRsvpModal && <RsvpModal />}
        <DeleteDialog />
        <div className="bg-[#0A0A0A]">
          {/* Large image */}
          {hasImage && (
            <div className="w-full">
              <img
                src={getImageUrl(post.mediaUrls![0])}
                alt="Event"
                className="w-full object-contain max-h-[620px]"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}

          <div className="p-5 space-y-5">
            {/* Title + owner menu */}
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-white text-2xl font-bold leading-tight flex-1">{cleanTitle || post.title}</h1>
              <OwnerMenu />
            </div>

            {/* Date row */}
            {displayDate && (
              <div className="flex items-start gap-3 py-3 border-t border-b border-gray-800">
                <div className="bg-[#D4AF37]/10 rounded-xl p-2.5">
                  <Calendar className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{displayDate}</p>
                  {eventData?.requiresRegistration && (
                    <p className="text-[#D4AF37] text-xs mt-0.5">Registration required</p>
                  )}
                </div>
              </div>
            )}

            {/* Hosted by */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Crown className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Hosted by</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-900 rounded-2xl p-3">
                <Avatar className="h-10 w-10 ring-2 ring-[#D4AF37]/40">
                  <AvatarImage src={getImageUrl(post.ministry?.logo)} />
                  <AvatarFallback className="bg-[#D4AF37] text-black">
                    <Church className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-semibold text-sm">{post.ministry?.name || 'Ministry'}</p>
                  {post.ministry?.denomination && (
                    <p className="text-gray-400 text-xs">{post.ministry.denomination}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            {isOnline ? (
              <div className="flex items-center gap-3 bg-gray-900 rounded-2xl p-3">
                <div className="bg-blue-900/30 rounded-xl p-2.5">
                  <Video className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Online Event</p>
                  {onlineLink && (
                    <a href={onlineLink} target="_blank" rel="noopener noreferrer"
                      className="text-[#D4AF37] text-xs hover:underline flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Join link
                    </a>
                  )}
                </div>
              </div>
            ) : location ? (
              <div className="flex items-center gap-3 bg-gray-900 rounded-2xl p-3">
                <div className="bg-red-900/30 rounded-xl p-2.5">
                  <MapPin className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{location}</p>
                  {eventData?.address && eventData.address !== location && (
                    <p className="text-gray-400 text-xs">{eventData.address}</p>
                  )}
                </div>
              </div>
            ) : null}

            {/* Description — only show the clean event description, never raw post.content */}
            {eventData?.description && (
              <div>
                <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">About</h3>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {eventData.description}
                </p>
              </div>
            )}

            {/* RSVP section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wide">Guest List</h3>
                {goingTotal > 0 && (
                  <span className="text-gray-400 text-xs">{goingTotal} {goingTotal !== goingCount ? `attending (${goingCount} ${goingCount === 1 ? 'person' : 'people'} + guests)` : 'going'}</span>
                )}
              </div>
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => handleRsvp('going')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all ${
                    userRsvp?.status === 'going'
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                      : 'bg-gray-900 border-gray-700 text-white hover:border-[#D4AF37]/50'
                  }`}
                >
                  <span className="text-xl">🙌</span>
                  Going
                </button>
                <button
                  onClick={() => handleRsvp('maybe')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all ${
                    userRsvp?.status === 'maybe'
                      ? 'bg-blue-900/40 border-blue-400 text-blue-300'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <span className="text-xl">🤔</span>
                  Maybe
                </button>
              </div>
              {eventId && (
                <button
                  onClick={shareEvent}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-gray-700 text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-all text-sm font-medium"
                >
                  <Share2 className="h-4 w-4" />
                  Share Event
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── REGULAR MINISTRY POST (non-event) ───────────────────────────────────
  return (
    <div className="bg-[#0A0A0A] rounded-2xl overflow-hidden border border-gray-800">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={getImageUrl(post.ministry?.logo)} alt={post.ministry?.name} />
          <AvatarFallback className="bg-[#D4AF37] text-black">
            <Church className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{post.ministry?.name || 'Ministry'}</span>
            {post.ministry?.denomination && (
              <Badge variant="outline" className="text-xs bg-blue-900/30 border-blue-600 text-blue-300">
                {post.ministry.denomination}
              </Badge>
            )}
            {post.type === 'announcement' && (
              <Badge className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30">Announcement</Badge>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-0.5 gap-1">
            <Clock className="h-3 w-3" />
            <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {post.title && (
          <h4 className="font-semibold text-white text-sm">{post.title}</h4>
        )}
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="rounded-xl overflow-hidden">
            {post.mediaUrls.map((url, i) => (
              <img key={i} src={getImageUrl(url)} alt="" className="w-full object-cover max-h-64" />
            ))}
          </div>
        )}

        {post.links && Array.isArray(post.links) && (post.links as any[]).length > 0 && (
          <div className="space-y-1">
            {(post.links as any[]).map((link: any, i) => (
              <a key={i} href={typeof link === 'string' ? link : link.url}
                target="_blank" rel="noopener noreferrer"
                className="text-[#D4AF37] hover:text-[#B8941F] text-sm flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                {typeof link === 'string' ? link : (link.title || link.url)}
              </a>
            ))}
          </div>
        )}

        <div className="pt-1 border-t border-gray-800">
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-[#D4AF37] border-[#D4AF37] text-black hover:bg-[#B8941F]"
            onClick={() => navigate(`/ministry-post/${post.id}`)}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Post
          </Button>
        </div>
      </div>
    </div>
  );
}
