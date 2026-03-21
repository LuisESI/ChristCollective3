import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Church, ExternalLink, Crown, X, Video, Globe } from "lucide-react";
import { MinistryPost } from "@shared/schema";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useAuthGuard } from "@/lib/auth-guard";
import { getImageUrl } from "@/lib/api-config";
import { useLocation } from "wouter";

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

export function MinistryPostCard({ post, disableClick = false, flatLayout = false }: MinistryPostCardProps) {
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const queryClient = useQueryClient();
  const { requireAuth } = useAuthGuard();
  const [, navigate] = useLocation();

  const isEventPost = post.type === 'event_announcement';
  const eventId = (post as any).eventId as number | null | undefined;

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
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      return apiRequest(`/api/ministry-posts/${post.id}/rsvp`, {
        method: 'POST',
        data: { status, notes }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post.id}/rsvp`] });
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post.id}/rsvps`] });
    }
  });

  const removeRsvpMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/ministry-posts/${post.id}/rsvp`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post.id}/rsvp`] });
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post.id}/rsvps`] });
    }
  });

  const handleRsvp = (status: string) => {
    requireAuth(() => {
      if (userRsvp?.status === status) {
        removeRsvpMutation.mutate();
      } else {
        rsvpMutation.mutate({ status });
      }
      setShowRsvpModal(false);
    }, "Please sign in to RSVP for events");
  };

  const getRsvpCount = (status: string) =>
    Array.isArray(rsvpCounts) ? rsvpCounts.find((r: any) => r.status === status)?.count || 0 : 0;

  const goingCount = getRsvpCount('going');

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
        className="w-full max-w-md bg-[#111] rounded-t-3xl p-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <div className="flex justify-end mb-2">
          <button onClick={() => setShowRsvpModal(false)} className="text-gray-500 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-white text-lg font-bold text-center mb-6">{cleanTitle}</h3>

        {/* Going / Can't Go circles */}
        <div className="flex justify-center gap-8 mb-8">
          {/* Going */}
          <button
            onClick={() => handleRsvp('going')}
            className={`flex flex-col items-center gap-2 transition-all ${
              userRsvp?.status === 'going' ? 'scale-110' : 'opacity-80 hover:opacity-100'
            }`}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl border-2 transition-all ${
              userRsvp?.status === 'going'
                ? 'bg-[#D4AF37]/20 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                : 'bg-gray-800 border-gray-600'
            }`}>
              🥳
            </div>
            <span className="text-white text-sm font-semibold">Going</span>
            {goingCount > 0 && (
              <span className="text-gray-400 text-xs">{goingCount} going</span>
            )}
          </button>

          {/* Can't Go */}
          <button
            onClick={() => handleRsvp('not_going')}
            className={`flex flex-col items-center gap-2 transition-all ${
              userRsvp?.status === 'not_going' ? 'scale-110' : 'opacity-80 hover:opacity-100'
            }`}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl border-2 transition-all ${
              userRsvp?.status === 'not_going'
                ? 'bg-gray-700 border-gray-400 shadow-lg'
                : 'bg-gray-800 border-gray-600'
            }`}>
              😓
            </div>
            <span className="text-gray-300 text-sm font-semibold">Can't Go</span>
          </button>
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

        <Button
          className="w-full bg-[#D4AF37] text-black font-bold hover:bg-[#B8941F] h-12 rounded-xl"
          onClick={() => setShowRsvpModal(false)}
        >
          Close
        </Button>
      </div>
    </div>
  );

  // ─── LUMA-STYLE EVENT CARD (feed) ─────────────────────────────────────────
  if (isEventPost && !flatLayout) {
    return (
      <>
        {showRsvpModal && <RsvpModal />}
        <div className="bg-[#0A0A0A] rounded-2xl overflow-hidden border border-gray-800">
          {/* Image */}
          {hasImage && (
            <div className="relative">
              <img
                src={getImageUrl(post.mediaUrls![0])}
                alt="Event"
                className="w-full aspect-[4/3] object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              {/* Ministry overlay top-left */}
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={getImageUrl(post.ministry?.logo)} />
                  <AvatarFallback className="bg-[#D4AF37] text-black text-[10px]">
                    <Church className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-white text-xs font-medium">{post.ministry?.name || 'Ministry'}</span>
              </div>
              {/* Event badge top-right */}
              <div className="absolute top-3 right-3">
                <Badge className="bg-[#D4AF37] text-black text-xs font-semibold">Event</Badge>
              </div>
            </div>
          )}

          {/* No image: show ministry header */}
          {!hasImage && (
            <div className="flex items-center gap-3 p-4 pb-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={getImageUrl(post.ministry?.logo)} />
                <AvatarFallback className="bg-[#D4AF37] text-black">
                  <Church className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white text-sm font-semibold">{post.ministry?.name || 'Ministry'}</p>
                <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30 text-[10px] mt-0.5">Event</Badge>
              </div>
            </div>
          )}

          <div className="p-4 space-y-3">
            {/* Title */}
            <h2 className="text-white text-xl font-bold leading-tight">{cleanTitle || post.title}</h2>

            {/* Date */}
            {displayDate && (
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

            {/* Hosted by */}
            <div className="flex items-center gap-2">
              <Crown className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span className="text-gray-500 text-xs">Hosted by</span>
              <Avatar className="h-5 w-5">
                <AvatarImage src={getImageUrl(post.ministry?.logo)} />
                <AvatarFallback className="bg-[#D4AF37] text-black text-[10px]">
                  <Church className="h-2.5 w-2.5" />
                </AvatarFallback>
              </Avatar>
              <span className="text-white text-xs font-medium">{post.ministry?.name || 'Ministry'}</span>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-800" />

            {/* RSVP Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => requireAuth(() => setShowRsvpModal(true), "Sign in to RSVP")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  userRsvp?.status === 'going'
                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                    : 'bg-gray-900 border-gray-700 text-white hover:border-[#D4AF37]/50'
                }`}
              >
                <span className="text-base">🥳</span>
                Going
                {goingCount > 0 && (
                  <span className="text-xs opacity-70">· {goingCount}</span>
                )}
              </button>

              <button
                onClick={() => requireAuth(() => setShowRsvpModal(true), "Sign in to RSVP")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  userRsvp?.status === 'not_going'
                    ? 'bg-gray-700 border-gray-500 text-gray-300'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                <span className="text-base">😓</span>
                Can't Go
              </button>
            </div>

            {/* View Event */}
            <button
              onClick={() => navigate(`/ministry-post/${post.id}`)}
              className="w-full text-center text-[#D4AF37] text-xs font-medium py-1 hover:text-[#B8941F] transition-colors"
            >
              View event details →
            </button>
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
        <div className="bg-[#0A0A0A]">
          {/* Large image */}
          {hasImage && (
            <div className="w-full">
              <img
                src={getImageUrl(post.mediaUrls![0])}
                alt="Event"
                className="w-full object-cover max-h-80"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}

          <div className="p-5 space-y-5">
            {/* Title */}
            <h1 className="text-white text-2xl font-bold leading-tight">{cleanTitle || post.title}</h1>

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

            {/* Description */}
            <div>
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">About</h3>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {post.content
                  .replace(/📅[^\n]*/g, '')
                  .replace(/📍[^\n]*/g, '')
                  .replace(/\n{3,}/g, '\n\n')
                  .trim()}
              </p>
            </div>

            {/* RSVP section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wide">Guest List</h3>
                {goingCount > 0 && (
                  <span className="text-gray-400 text-xs">{goingCount} Going</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => requireAuth(() => setShowRsvpModal(true), "Sign in to RSVP")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all ${
                    userRsvp?.status === 'going'
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                      : 'bg-gray-900 border-gray-700 text-white hover:border-[#D4AF37]/50'
                  }`}
                >
                  <span className="text-xl">🥳</span>
                  Going
                </button>
                <button
                  onClick={() => requireAuth(() => setShowRsvpModal(true), "Sign in to RSVP")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all ${
                    userRsvp?.status === 'not_going'
                      ? 'bg-gray-700 border-gray-500 text-gray-200'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <span className="text-xl">😓</span>
                  Can't Go
                </button>
              </div>
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
