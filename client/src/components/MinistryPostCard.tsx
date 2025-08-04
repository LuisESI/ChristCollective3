import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Church, RotateCcw, MousePointer, ExternalLink } from "lucide-react";
import { MinistryPost } from "@shared/schema";
import { useState } from "react";

interface MinistryPostCardProps {
  post: MinistryPost & {
    ministry?: {
      id: number;
      name: string;
      logo?: string;
      denomination?: string;
    };
  };
}

export function MinistryPostCard({ post }: MinistryPostCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  
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

  // For event posts with media, render interactive flip card
  if (isEventWithMedia) {
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
            <Card className="h-full bg-gray-900/50 border-gray-700 backdrop-blur overflow-hidden">
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
                    <h3 className="font-semibold text-white text-sm">
                      {post.ministry?.name || 'Ministry'}
                    </h3>
                    <Badge variant="outline" className="text-xs bg-green-900/50 border-green-400 text-green-200">
                      <Calendar className="h-3 w-3 mr-1" />
                      Event
                    </Badge>
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
            <Card className="h-full bg-gray-900/90 border-gray-700 backdrop-blur">
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
              
              <CardContent className="pt-0 overflow-y-auto h-full pb-4">
                {post.title && (
                  <h4 className="font-semibold text-white mb-3 text-base">
                    {post.title.replace('New Event: ', '')}
                  </h4>
                )}
                
                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {post.content.replace(/all are welcome/gi, '').trim()}
                </div>
                
                {/* View Post Button */}
                <div className="mt-4 pt-3 border-t border-gray-600">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/post/${post.id}`;
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>


      </div>
    );
  }

  // Regular ministry post layout for non-event posts or events without media
  return (
    <Card className="bg-gray-900/50 border-gray-700 backdrop-blur hover:bg-gray-900/70 transition-all duration-300">
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
          {post.content.replace(/all are welcome/gi, '').trim()}
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
            {post.links.map((link: unknown, index: number) => {
              const linkStr = String(link);
              return (
                <a
                  key={index}
                  href={linkStr}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/90 text-sm break-all"
                >
                  {linkStr}
                </a>
              );
            })}
          </div>
        )}
        
        {/* View Post Button */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            onClick={() => window.location.href = `/post/${post.id}`}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}