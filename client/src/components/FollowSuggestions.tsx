import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreatePostModal } from "@/components/CreatePostModal";
import { Link } from "wouter";
import { Plus, Users, Building2, Church, UserPlus, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useRef, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Add CSS for hiding scrollbar
const scrollbarHideStyle = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

export function FollowSuggestions() {
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: creators } = useQuery({
    queryKey: ["/api/content-creators"],
  });

  const { data: businesses } = useQuery({
    queryKey: ["/api/business-profiles"],
  });

  const { data: ministries } = useQuery({
    queryKey: ["/api/ministries"],
  });

  // Scroll functions for the slider
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // Get random suggestions from each category
  const getRandomSuggestions = () => {
    const suggestions: any[] = [];

    // Add random creators
    if (creators?.length) {
      const randomCreators = creators
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((creator: any) => ({
          ...creator,
          type: 'creator',
          displayName: creator.name,
          description: creator.bio || 'Content Creator',
          followers: creator.totalFollowers || 0,
          avatar: creator.profileImageUrl,
          userId: creator.userId, // Add userId for follow functionality
        }));
      suggestions.push(...randomCreators);
    }

    // Add random businesses
    if (businesses?.length) {
      const randomBusinesses = businesses
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
        .map((business: any) => ({
          ...business,
          type: 'business',
          displayName: business.companyName,
          description: business.description || business.industry || 'Business professional',
          avatar: business.logoUrl,
          userId: business.userId, // Add userId for follow functionality
        }));
      suggestions.push(...randomBusinesses);
    }

    // Add random ministries
    if (ministries?.length) {
      const randomMinistries = ministries
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
        .map((ministry: any) => ({
          ...ministry,
          type: 'ministry',
          displayName: ministry.name,
          description: ministry.description || 'Ministry organization',
          followers: 0, // No follower count for ministries
          avatar: ministry.logoUrl,
          userId: ministry.userId, // Add userId for follow functionality
        }));
      suggestions.push(...randomMinistries);
    }

    return suggestions.sort(() => Math.random() - 0.5).slice(0, 6);
  };

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      return apiRequest(`/api/users/${targetUserId}/follow`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully followed user!",
      });
      // Optionally refetch user stats or update UI
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  // Update suggestions when data loads
  React.useEffect(() => {
    setSuggestions(getRandomSuggestions());
  }, [creators, businesses, ministries]);

  const getProfileLink = (suggestion: any) => {
    switch (suggestion.type) {
      case 'creator':
        return `/creators/${suggestion.id}`;
      case 'business':
        return `/business/profile/${suggestion.id}`;
      case 'ministry':
        return `/ministry-profile`; // Adjust based on your ministry routing
      default:
        return '#';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'creator':
        return <Users className="w-4 h-4" />;
      case 'business':
        return <Building2 className="w-4 h-4" />;
      case 'ministry':
        return <Church className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'creator':
        return 'bg-purple-500/20 text-purple-300';
      case 'business':
        return 'bg-blue-500/20 text-blue-300';
      case 'ministry':
        return 'bg-green-500/20 text-green-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyle }} />
      <div className="col-span-full space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-700">
          <Heart className="w-16 h-16 text-[#D4AF37] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Welcome to the Community!</h3>
          <p className="text-gray-400 mb-6">
            Share your faith journey, inspire others with God's love, and help build a community where Christ's light shines through every story
          </p>
          {user && (
            <CreatePostModal
              trigger={
                <Button className="bg-[#D4AF37] text-black hover:bg-[#B8941F]">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Post
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Follow Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-xl font-semibold text-white">Discover Amazing Profiles</h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={scrollLeft}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={scrollRight}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {suggestions.map((suggestion, index) => (
              <Card key={`${suggestion.type}-${suggestion.id}-${index}`} className="bg-gray-900 border-gray-700 hover:border-[#D4AF37]/50 transition-colors flex-shrink-0 w-80">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={suggestion.avatar} alt={suggestion.displayName} />
                      <AvatarFallback className="bg-[#D4AF37] text-black">
                        {suggestion.displayName?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{suggestion.displayName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getTypeColor(suggestion.type)}`}>
                          {getTypeIcon(suggestion.type)}
                          <span className="ml-1 capitalize">{suggestion.type}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {suggestion.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {suggestion.type === 'creator' && suggestion.totalFollowers ? (
                      <span className="text-xs text-gray-500">
                        {(suggestion.totalFollowers || 0).toLocaleString()} followers
                      </span>
                    ) : (
                      <div className="flex-1"></div>
                    )}
                    
                    <div className="flex gap-2 flex-shrink-0">
                      <Link href={getProfileLink(suggestion)}>
                        <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                          View
                        </Button>
                      </Link>
                      {user && (
                        <Button 
                          size="sm" 
                          className="bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                          onClick={() => followMutation.mutate(suggestion.userId)}
                          disabled={followMutation.isPending}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          {followMutation.isPending ? "Following..." : "Follow"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Show More Button */}
          <div className="text-center mt-6">
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              onClick={() => setSuggestions(getRandomSuggestions())}
            >
              Show More Suggestions
            </Button>
          </div>
        </div>
      )}

      {/* Fallback if no profiles exist */}
      {suggestions.length === 0 && (
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-700 text-center">
          <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Profiles Yet</h3>
          <p className="text-gray-400">
            Be the first to create a profile and start building the community!
          </p>
        </div>
      )}
      </div>
    </>
  );
}