import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Church } from "lucide-react";
import { MinistryPost } from "@shared/schema";

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
                <Badge variant="outline" className="ml-2 text-xs bg-purple-900/30 border-purple-600 text-purple-300">
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
          {post.content}
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
      </CardContent>
    </Card>
  );
}