import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Church, RotateCcw, MousePointer, ExternalLink, Users, CheckCircle, Clock3, X } from "lucide-react";
import { MinistryPost } from "@shared/schema";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useAuthGuard } from "@/lib/auth-guard";

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

export function MinistryPostCard({ post, disableClick = false, flatLayout = false }: MinistryPostCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const queryClient = useQueryClient();
  const { requireAuth } = useAuthGuard();

  // RSVP functionality for event posts
  const { data: userRsvp } = useQuery({
    queryKey: [`/api/ministry-posts/${post.id}/rsvp`],
    enabled: post.type === 'event_announcement' && isAuthenticated,
  });

  const { data: rsvpCounts } = useQuery({
    queryKey: [`/api/ministry-posts/${post.id}/rsvps`],
    enabled: post.type === 'event_announcement',
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
      queryClient.invalidateQueries({ queryKey: ['/api/ministry-posts'] });
    }
  });

  const removeRsvpMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/ministry-posts/${post.id}/rsvp`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post.id}/rsvp`] });
      queryClient.invalidateQueries({ queryKey: [`/api/ministry-posts/${post.id}/rsvps`] });
      queryClient.invalidateQueries({ queryKey: ['/api/ministry-posts'] });
    }
  });

  const handleRsvp = (status: string) => {
    requireAuth(() => {
      if ((userRsvp as any)?.status === status) {
        removeRsvpMutation.mutate();
      } else {
        rsvpMutation.mutate({ status });
      }
    }, "Please sign in to RSVP for events");
  };

  const getRsvpIcon = (status: string) => {
    switch (status) {
      case 'going':
        return <CheckCircle className="w-4 h-4" />;
      case 'maybe':
        return <Clock3 className="w-4 h-4" />;
      case 'not_going':
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRsvpColor = (status: string, isActive: boolean) => {
    if (!isActive) return "text-gray-400 border-gray-300";
    
    switch (status) {
      case 'going':
        return "text-green-600 border-green-600 bg-green-50";
      case 'maybe':
        return "text-yellow-600 border-yellow-600 bg-yellow-50";
      case 'not_going':
        return "text-red-600 border-red-600 bg-red-50";
      default:
        return "text-gray-600 border-gray-300";
    }
  };

  const getRsvpCount = (status: string) => {
    return Array.isArray(rsvpCounts) ? rsvpCounts.find((r: any) => r.status === status)?.count || 0 : 0;
  };
  
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if this is an event post with media
  const isEventWithMedia = post.type === 'event_announcement' && post.mediaUrls && post.mediaUrls.length > 0;

  // For event posts with media, render interactive flip card (unless flat layout is requested)
  if (isEventWithMedia && !flatLayout) {
    return (
      <div className="flip-card-container relative h-96 w-full perspective-1000">
        <div 
          className={`flip-card relative w-full h-full transition-transform duration-700 transform-style-preserve-3d cursor-pointer ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          onMouseEnter={() => setIsFlipped(true)}
          onMouseLeave={() => setIsFlipped(false)}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front side - Image */}
          <div className="flip-card-front absolute inset-0 w-full h-full backface-hidden">
            <Card className="h-full bg-black border-gray-700 backdrop-blur overflow-hidden">
              <div className="relative h-full">
                <img 
                  src={post.mediaUrls?.[0] || ''} 
                  alt="Event flyer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log('Image failed to load:', post.mediaUrls?.[0]);
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMUYyOTM3Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE2MCA5MUwyNDAgOTFMMjAwIDE1MFoiIGZpbGw9IiNENEFGMzciLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxODgiIHk9IjEzOCI+CjxwYXRoIGQ9Im0xNSAyLTEgMWg0djJIMHYtMmg0bC0xLTFoMTJabTIuNSA0aC0xMWwyIDExaDdsMi0xMVoiIGZpbGw9IiNENEFGMzciLz4KPHN2Zz4=';
                  }}
                  onLoad={() => console.log('Image loaded successfully:', post.mediaUrls?.[0])}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
                
                {/* Hover indicator */}
                <div className="absolute top-4 right-4 bg-black/60 rounded-full p-2">
                  <MousePointer className="h-4 w-4 text-white" />
                </div>
                
                {/* Basic info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.ministry?.logo} alt={post.ministry?.name} />
                      <AvatarFallback className="bg-primary text-black">
                        <Church className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <h3 className="font-semibold text-white text-sm">
                        {post.ministry?.name || 'Ministry'}
                      </h3>
                      <div className="flex gap-1 mt-1">
                        {post.ministry?.denomination && (
                          <Badge variant="outline" className="text-xs bg-blue-900/50 border-blue-400 text-blue-200">
                            {post.ministry.denomination}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs bg-green-900/50 border-green-400 text-green-200">
                          <Calendar className="h-3 w-3 mr-1" />
                          Event
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <h4 className="font-bold text-white text-lg mb-1">
                    {post.title?.replace('New Event: ', '') || 'Event'}
                  </h4>
                  <p className="text-xs text-gray-300 opacity-80">
                    Hover or click for details
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Back side - Details */}
          <div className="flip-card-back absolute inset-0 w-full h-full backface-hidden rotate-y-180">
            <Card className="h-full bg-black border-gray-700 backdrop-blur flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.ministry?.logo} alt={post.ministry?.name} />
                    <AvatarFallback className="bg-primary text-black">
                      <Church className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-white text-sm truncate">
                        {post.ministry?.name || 'Ministry'}
                      </h3>
                      {post.ministry?.denomination && (
                        <Badge variant="outline" className="text-xs bg-blue-900/30 border-blue-600 text-blue-300">
                          {post.ministry.denomination}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{formatDate(post.createdAt)}</span>
                      <Badge variant="outline" className="ml-2 text-xs bg-green-900/30 border-green-600 text-green-300">
                        <Calendar className="h-3 w-3 mr-1" />
                        Event
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 flex items-center">
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Flip
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 flex flex-col h-full p-4">
                <div className="flex-1 overflow-y-auto">
                  {post.title && (
                    <h4 className="font-semibold text-white mb-3 text-base">
                      {post.title.replace('New Event: ', '')}
                    </h4>
                  )}
                  
                  <div className="text-gray-300 text-sm leading-relaxed line-clamp-6">
                    {post.content
                      .replace(/📅\s*Beach & Bonfire \(Young Adults\)/gi, '')
                      .replace(/all are welcome/gi, '')
                      .replace(/!/g, '')
                      .trim()}
                  </div>
                </div>
                
                {/* RSVP and View Post Buttons */}
                <div className="pt-3 border-t border-gray-600 mt-3">
                  <div className="flex space-x-2">
                    {/* View Post Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className={`${post.type === 'event_announcement' ? 'flex-1' : 'w-full'} bg-[#D4AF37] border-[#D4AF37] text-black hover:bg-[#B8941F] hover:text-black`}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/ministry-post/${post.id}`;
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Post
                    </Button>

                    {/* RSVP Button - Only for event posts */}
                    {post.type === 'event_announcement' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex-1 ${(userRsvp as any)?.status ? getRsvpColor((userRsvp as any).status, true) : 'text-gray-400 border-gray-500 hover:border-green-500 hover:text-green-400'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          
                          if (!isAuthenticated) {
                            window.location.href = '/login';
                            return;
                          }
                          
                          // Cycle through RSVP states: null -> going -> maybe -> not_going -> null
                          const currentStatus = (userRsvp as any)?.status;
                          if (!currentStatus) {
                            handleRsvp('going');
                          } else if (currentStatus === 'going') {
                            handleRsvp('maybe');
                          } else if (currentStatus === 'maybe') {
                            handleRsvp('not_going');
                          } else {
                            removeRsvpMutation.mutate();
                          }
                        }}
                        disabled={rsvpMutation.isPending || removeRsvpMutation.isPending}
                      >
                        {(userRsvp as any)?.status ? getRsvpIcon((userRsvp as any).status) : <Users className="w-4 h-4" />}
                        <span className="ml-1 text-xs">
                          {(userRsvp as any)?.status ? 
                            ((userRsvp as any).status === 'going' ? 'Going' : 
                             (userRsvp as any).status === 'maybe' ? 'Maybe' : "Can't Go") 
                            : 'RSVP'}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Flat layout for event posts on individual post pages
  if (isEventWithMedia && flatLayout) {
    return (
      <Card className="bg-black border-gray-700 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.ministry?.logo} alt={post.ministry?.name} />
              <AvatarFallback className="bg-primary text-black">
                <Church className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-white text-sm truncate">
                  {post.ministry?.name || 'Ministry'}
                </h3>
                {post.ministry?.denomination && (
                  <Badge variant="outline" className="text-xs bg-blue-900/30 border-blue-600 text-blue-300">
                    {post.ministry.denomination}
                  </Badge>
                )}
              </div>
              <div className="flex items-center text-xs text-gray-400 mt-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formatDate(post.createdAt)}</span>
                <Badge variant="outline" className="ml-2 text-xs bg-green-900/30 border-green-600 text-green-300">
                  <Calendar className="h-3 w-3 mr-1" />
                  Event
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Event Title */}
          {post.title && (
            <h4 className="font-semibold text-white text-base">
              {post.title.replace('New Event: ', '')}
            </h4>
          )}
          
          {/* Event Content */}
          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {post.content
              .replace(/📅\s*Beach & Bonfire \(Young Adults\)/gi, '')
              .replace(/all are welcome/gi, '')
              .replace(/!/g, '')
              .trim()}
          </div>
          
          {/* Event Image - Full Size */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="w-full">
              <img 
                src={post.mediaUrls[0]} 
                alt="Event flyer"
                className="w-full h-auto object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMUYyOTM3Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE2MCA5MUwyNDAgOTFMMjAwIDE1MFoiIGZpbGw9IiNENEFGMzciLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxODgiIHk9IjEzOCI+CjxwYXRoIGQ9Im0xNSAyLTEgMWg0djJIMHYtMmg0bC0xLTFoMTJabTIuNSA0aC0xMWwyIDExaDdsMi0xMVoiIGZpbGw9IiNENEFGMzciLz4KPHN2Zz4=';
                }}
              />
            </div>
          )}
          
          {/* Additional Links */}
          {post.links && Array.isArray(post.links) && post.links.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Related Links:</h4>
              {post.links.map((link: string, index: number) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/90 block break-all"
                  >
                    {link}
                  </a>
                ))}
            </div>
          )}


        </CardContent>
      </Card>
    );
  }

  // Regular ministry post layout for non-event posts or events without media
  return (
    <Card className="bg-black border-gray-700 backdrop-blur hover:bg-gray-900/70 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.ministry?.logo} alt={post.ministry?.name} />
            <AvatarFallback className="bg-primary text-black text-sm font-bold">
              <Church className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white text-sm truncate">
                {post.ministry?.name || 'Ministry'}
              </h3>
              {post.ministry?.denomination && (
                <Badge variant="outline" className="text-xs bg-blue-900/30 border-blue-600 text-blue-300">
                  {post.ministry.denomination}
                </Badge>
              )}
            </div>
            <div className="flex items-center text-xs text-gray-400 mt-1">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatDate(post.createdAt)}</span>
              {post.type === 'event_announcement' && (
                <Badge variant="outline" className="ml-2 text-xs bg-green-900/30 border-green-600 text-green-300">
                  <Calendar className="h-3 w-3 mr-1" />
                  Event
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {post.title && (
          <h4 className="font-semibold text-white mb-2 text-sm">{post.title}</h4>
        )}
        
        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
          {post.content
            .replace(/📅\s*Beach & Bonfire \(Young Adults\)/gi, '')
            .replace(/all are welcome/gi, '')
            .replace(/!/g, '')
            .trim()}
        </div>
        
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="mt-3">
            {post.mediaUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Ministry post media ${index + 1}`}
                className="w-full rounded-lg object-cover max-h-64"
              />
            ))}
          </div>
        )}
        
        {post.links && Array.isArray(post.links) && post.links.length > 0 && (
          <div className="mt-3 space-y-1">
            {post.links.map((link: string, index: number) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/90 text-sm break-all"
                >
                  {link}
                </a>
              ))}
          </div>
        )}
        
        {/* RSVP and View Post Buttons */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="flex space-x-2">
            {/* View Post Button */}
            <Button
              variant="outline"
              size="sm"
              className={`${post.type === 'event_announcement' ? 'flex-1' : 'w-full'} bg-[#D4AF37] border-[#D4AF37] text-black hover:bg-[#B8941F] hover:text-black`}
              onClick={() => window.location.href = `/ministry-post/${post.id}`}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Post
            </Button>

            {/* RSVP Button - Only for event posts */}
            {post.type === 'event_announcement' && (
              <Button
                variant="outline"
                size="sm"
                className={`flex-1 ${(userRsvp as any)?.status ? getRsvpColor((userRsvp as any).status, true) : 'text-gray-400 border-gray-500 hover:border-green-500 hover:text-green-400'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  
                  if (!isAuthenticated) {
                    window.location.href = '/login';
                    return;
                  }
                  
                  // Cycle through RSVP states: null -> going -> maybe -> not_going -> null
                  const currentStatus = (userRsvp as any)?.status;
                  if (!currentStatus) {
                    handleRsvp('going');
                  } else if (currentStatus === 'going') {
                    handleRsvp('maybe');
                  } else if (currentStatus === 'maybe') {
                    handleRsvp('not_going');
                  } else {
                    removeRsvpMutation.mutate();
                  }
                }}
                disabled={rsvpMutation.isPending || removeRsvpMutation.isPending}
              >
                {(userRsvp as any)?.status ? getRsvpIcon((userRsvp as any).status) : <Users className="w-4 h-4" />}
                <span className="ml-1 text-xs">
                  {(userRsvp as any)?.status ? 
                    ((userRsvp as any).status === 'going' ? 'Going' : 
                     (userRsvp as any).status === 'maybe' ? 'Maybe' : "Can't Go") 
                    : 'RSVP'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}