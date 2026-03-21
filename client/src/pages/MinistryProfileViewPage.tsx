import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  ExternalLink, 
  Calendar,
  Heart,
  Share2,
  ArrowLeft,
  Clock,
  Globe,
  UserPlus,
  UserMinus,
  Pencil
} from "lucide-react";
import { Link } from "wouter";
import { MinistryEvent } from "@shared/schema";
import { buildApiUrl, getImageUrl, getMobileAuthHeaders } from "@/lib/api-config";
import { apiRequest } from "@/lib/queryClient";

export default function MinistryProfileViewPage() {
  const [match, params] = useRoute("/ministry/:id");
  const [, navigate] = useLocation();
  const ministryId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ministry, isLoading } = useQuery({
    queryKey: ["/api/ministries", ministryId],
    queryFn: async () => {
      const response = await fetch(buildApiUrl(`/api/ministries/${ministryId}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Ministry not found");
      return response.json();
    },
    enabled: !!ministryId,
  });

  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ["/api/ministries", ministryId, "events"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl(`/api/ministries/${ministryId}/events?t=${Date.now()}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
    enabled: !!ministryId,
    staleTime: 0,
    gcTime: 0
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await fetch(buildApiUrl("/api/user"), {
        credentials: 'include',
        headers: getMobileAuthHeaders(),
      });
      if (!response.ok) return null;
      return response.json();
    },
  });

  const { data: isFollowing = false } = useQuery({
    queryKey: ["/api/ministries", ministryId, "following"],
    queryFn: async () => {
      if (!currentUser || !ministryId) return false;
      const response = await fetch(buildApiUrl(`/api/ministries/${ministryId}/following`), {
        credentials: 'include',
        headers: getMobileAuthHeaders(),
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data.isFollowing;
    },
    enabled: !!currentUser && !!ministryId,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/ministries/${ministryId}/follow`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to follow ministry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ministries", ministryId, "following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ministries", ministryId] });
      toast({ title: "Success", description: "You are now following this ministry!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to follow ministry. Please try again.", variant: "destructive" });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/ministries/${ministryId}/follow`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to unfollow ministry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ministries", ministryId, "following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ministries", ministryId] });
      toast({ title: "Success", description: "You have unfollowed this ministry." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to unfollow ministry. Please try again.", variant: "destructive" });
    },
  });

  const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const isOwnMinistry = currentUser && ministry && ministry.userId === currentUser.id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="animate-pulse">
          <div className="h-40 md:h-48 bg-gray-800" />
          <div className="max-w-4xl mx-auto px-4">
            <div className="w-24 h-24 rounded-full bg-gray-700 -mt-12 ring-2 ring-[#D4AF37] border-4 border-black" />
            <div className="mt-4 space-y-3">
              <div className="h-7 bg-gray-700 rounded w-1/3" />
              <div className="h-4 bg-gray-700 rounded w-1/4" />
              <div className="h-4 bg-gray-700 rounded w-full" />
              <div className="h-4 bg-gray-700 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ministry) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/ministries">
            <Button variant="ghost" className="mb-6 text-gray-300 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ministries
            </Button>
          </Link>
          <Card className="bg-[#0A0A0A] border-gray-800">
            <CardContent className="p-8 text-center">
              <Building className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Ministry Not Found</h3>
              <p className="text-gray-500">The ministry you're looking for doesn't exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const socialLinks = ministry.socialLinks as Record<string, string> | null;

  return (
    <>
      <Helmet>
        <title>{ministry.name} - Ministry Profile | Christ Collective</title>
        <meta name="description" content={`Learn more about ${ministry.name}, a ${ministry.denomination} ministry serving the community.`} />
      </Helmet>
      
      <div className="min-h-screen bg-black text-white pb-20">
        <div className="relative h-40 md:h-48 bg-gradient-to-b from-gray-900 to-black overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 via-gray-900 to-black" />
          <Link href="/ministries">
            <Button variant="ghost" className="absolute top-4 left-4 z-10 text-white/80 hover:text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-end justify-between">
            <Avatar className="w-24 h-24 -mt-12 ring-2 ring-[#D4AF37] border-4 border-black">
              <AvatarImage src={getImageUrl(ministry.logo)} alt={ministry.name} />
              <AvatarFallback className="bg-gray-800 text-[#D4AF37] text-2xl font-bold">
                {ministry.name?.charAt(0) || 'M'}
              </AvatarFallback>
            </Avatar>

            <div className="flex gap-2 pb-2">
              {currentUser && !isOwnMinistry && (
                <Button
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  className={`font-medium ${
                    isFollowing
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-[#D4AF37] text-black hover:bg-[#B8941F]'
                  }`}
                >
                  {followMutation.isPending || unfollowMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : isFollowing ? (
                    <UserMinus className="h-4 w-4 mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              )}
              {isOwnMinistry && (
                <Link href={`/ministry/${ministryId}/edit`}>
                  <Button variant="outline" className="border-[#D4AF37] text-white bg-transparent hover:bg-[#D4AF37]/10 font-medium">
                    Edit Ministry
                  </Button>
                </Link>
              )}
              <Button variant="outline" className="border-gray-700 text-white bg-transparent hover:bg-white/10">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-3">
            <h1 className="text-2xl font-bold">{ministry.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {ministry.denomination && (
                <Badge variant="outline" className="bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]">
                  {ministry.denomination}
                </Badge>
              )}
              {ministry.isVerified && (
                <Badge className="bg-green-900/30 border-green-600 text-green-300">
                  ✓ Verified
                </Badge>
              )}
            </div>
          </div>

          {ministry.description && (
            <div className="mt-3">
              <p className="text-sm text-gray-300 leading-relaxed">{ministry.description}</p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {ministry.location && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4 text-[#D4AF37]" />
                <span>{ministry.location}</span>
                {ministry.address && <span className="text-gray-500">· {ministry.address}</span>}
              </div>
            )}
            {ministry.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-[#D4AF37]" />
                <a href={`mailto:${ministry.email}`} className="text-[#D4AF37] hover:underline">{ministry.email}</a>
              </div>
            )}
            {ministry.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-[#D4AF37]" />
                <a href={`tel:${ministry.phone}`} className="text-[#D4AF37] hover:underline">{ministry.phone}</a>
              </div>
            )}
            {ministry.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-[#D4AF37]" />
                <a href={ministry.website.startsWith('http') ? ministry.website : `https://${ministry.website}`} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline break-all">{ministry.website}</a>
              </div>
            )}
          </div>

          {socialLinks && Object.keys(socialLinks).some(k => socialLinks[k]) && (
            <div className="flex gap-3 overflow-x-auto pb-2 mt-4">
              {Object.entries(socialLinks).map(([platform, url]) =>
                url ? (
                  <a
                    key={platform}
                    href={url.startsWith('http') ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 min-w-[72px] p-3 bg-[#0A0A0A] border border-gray-800 rounded-xl hover:bg-[#111] transition-colors"
                  >
                    <div className="w-9 h-9 bg-[#0A0A0A] rounded-full flex items-center justify-center border border-gray-800">
                      <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <span className="text-xs font-medium capitalize text-gray-300">{platform}</span>
                  </a>
                ) : null
              )}
            </div>
          )}

          <div className="border border-gray-800 rounded-xl p-4 mt-5">
            <div className="flex justify-around text-center">
              <div>
                <div className="text-lg font-semibold text-[#D4AF37]">{ministry.followersCount || 0}</div>
                <div className="text-xs text-gray-400">Followers</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-[#D4AF37]">{events.length}</div>
                <div className="text-xs text-gray-400">Events</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-[#D4AF37]">0</div>
                <div className="text-xs text-gray-400">Posts</div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Card className="bg-[#0A0A0A] border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingEvents ? (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full border-b-2 border-[#D4AF37] h-8 w-8 mx-auto mb-4"></div>
                    <p className="text-gray-400 text-sm">Loading events...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No upcoming events</p>
                    <p className="text-gray-500 text-xs mt-1">Stay tuned for announcements</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event: MinistryEvent) => {
                      const isOwner = currentUser?.id === ministry?.userId;
                      return (
                      <div 
                        key={event.id} 
                        className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
                      >
                        <div className="flex gap-4">
                          {event.flyerImage && (
                            <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate(`/events/${event.id}`)}>
                              <img
                                src={getImageUrl(event.flyerImage)}
                                alt={`${event.title} flyer`}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-700"
                              />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/events/${event.id}`)}>
                            <h4 className="text-white font-semibold mb-1">{event.title}</h4>
                            <p className="text-gray-400 text-sm mb-2 line-clamp-2">{event.description}</p>
                            
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(event.startDate).toLocaleDateString()}
                              </div>
                              {event.location && (
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {event.location}
                                </div>
                              )}
                              {event.isOnline && (
                                <div className="flex items-center">
                                  <Globe className="h-3 w-3 mr-1" />
                                  Online
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <Badge variant="outline" className="border-gray-700 text-gray-400 text-[10px]">
                                {event.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </Badge>
                              {event.maxAttendees && (
                                <span className="text-[10px] text-gray-500">
                                  {event.currentAttendees || 0}/{event.maxAttendees} attending
                                </span>
                              )}
                            </div>
                          </div>

                          {isOwner && (
                            <div className="flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#D4AF37] hover:bg-[#D4AF37]/10 h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/events/${event.id}/edit`);
                                }}
                                title="Edit event"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
