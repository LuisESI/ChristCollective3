import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, TrendingUp, Users, DollarSign, Star, Check, ImageIcon } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/platform";
import { getImageUrl } from "@/lib/api-config";

export default function ExplorePage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (!isLoading && !user) {
      const authRoute = isNativeApp() ? "/auth/mobile" : "/auth";
      navigate(`${authRoute}?redirect=/explore`);
    }
  }, [isLoading, user, navigate]);

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    enabled: !!user,
  });

  const { data: creators, isLoading: creatorsLoading } = useQuery({
    queryKey: ["/api/content-creators"],
    enabled: !!user,
  });

  const { data: businesses, isLoading: businessesLoading } = useQuery({
    queryKey: ["/api/business-profiles"],
    enabled: !!user,
  });

  const { data: ministries, isLoading: ministriesLoading } = useQuery({
    queryKey: ["/api/ministries"],
    enabled: !!user,
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/platform-posts"],
    enabled: !!user,
  });

  const { data: userFollowing } = useQuery({
    queryKey: [`/api/users/${user?.id}/following`],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  const categories = [
    { id: "all", label: "All", icon: TrendingUp },
    { id: "posts", label: "Posts", icon: Star },
    { id: "campaigns", label: "Campaigns", icon: DollarSign },
    { id: "creators", label: "Creators", icon: Star },
    { id: "businesses", label: "Businesses", icon: Users },
    { id: "ministries", label: "Ministries", icon: Star },
    { id: "users", label: "Members", icon: Users },
  ];

  const filteredPosts = posts && Array.isArray(posts) ? posts.filter((post: any) =>
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const filteredCampaigns = campaigns && Array.isArray(campaigns) ? campaigns.filter((campaign: any) =>
    campaign.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const filteredCreators = creators && Array.isArray(creators) ? creators.filter((creator: any) =>
    creator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.content?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const filteredBusinesses = businesses && Array.isArray(businesses) ? businesses.filter((business: any) =>
    business.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const filteredMinistries = ministries && Array.isArray(ministries) ? ministries.filter((ministry: any) =>
    ministry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ministry.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const filteredUsers = allUsers && Array.isArray(allUsers) ? allUsers.filter((targetUser: any) => {
    if (targetUser.id === user?.id) return false;
    
    const hasMinistryProfile = ministries && Array.isArray(ministries) && ministries.some((ministry: any) => ministry.userId === targetUser.id);
    const hasCreatorProfile = creators && Array.isArray(creators) && creators.some((creator: any) => creator.userId === targetUser.id);
    const hasBusinessProfile = businesses && Array.isArray(businesses) && businesses.some((business: any) => business.userId === targetUser.id);
    
    const isRegularUser = !hasMinistryProfile && !hasCreatorProfile && !hasBusinessProfile;
    
    const matchesSearch = targetUser.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      targetUser.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      targetUser.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      targetUser.bio?.toLowerCase().includes(searchTerm.toLowerCase());
      
    return isRegularUser && matchesSearch;
  }) : [];

  const randomizedUsers = filteredUsers.length > 0 ? (() => {
    const followingIds = userFollowing && Array.isArray(userFollowing) ? userFollowing.map((follow: any) => follow.id) : [];
    
    const unfollowedUsers = filteredUsers.filter((targetUser: any) => !followingIds.includes(targetUser.id));
    const followedUsers = filteredUsers.filter((targetUser: any) => followingIds.includes(targetUser.id));
    
    const shuffleArray = (array: any[]) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    const shuffledUnfollowed = shuffleArray(unfollowedUsers);
    const shuffledFollowed = shuffleArray(followedUsers);
    
    return [...shuffledUnfollowed, ...shuffledFollowed];
  })() : [];

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="bg-black border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">Explore</h1>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search for people, topics, or posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#0A0A0A] border-gray-800 text-white placeholder:text-gray-500 focus:border-[#D4AF37]"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-1 md:px-4 py-6 max-w-4xl">
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide px-3 md:px-0">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#D4AF37] text-black"
                    : "bg-transparent border border-gray-800 text-gray-400 hover:border-gray-500"
                }`}
              >
                {isActive && <Check className="h-4 w-4" />}
                <Icon className="h-4 w-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        {(selectedCategory === "all" || selectedCategory === "posts") && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-3 md:px-0">
              <h3 className="text-lg font-semibold text-[#D4AF37] font-italic italic">Latest Posts</h3>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#D4AF37]" onClick={() => setSelectedCategory("posts")}>
                View All
              </Button>
            </div>
            {postsLoading ? (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse bg-[#0A0A0A] rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {filteredPosts?.slice(0, 9).map((post: any) => (
                  <div 
                    key={post.id} 
                    className="aspect-square relative group overflow-hidden rounded-lg cursor-pointer bg-[#0A0A0A] border border-gray-900"
                    onClick={() => navigate(`/posts/${post.id}`)}
                  >
                    {post.mediaUrls?.[0] ? (
                      <div className="w-full h-full">
                        {post.mediaType === 'video' ? (
                          <div className="w-full h-full bg-[#111] flex items-center justify-center">
                            <Star className="text-[#D4AF37] opacity-50" size={24} />
                          </div>
                        ) : (
                          <img 
                            src={getImageUrl(post.mediaUrls[0])} 
                            alt={post.title || "Post"}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#111] text-gray-500 p-2 text-[10px] text-center">
                        {post.content?.substring(0, 50)}...
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 md:p-4">
                      {post.title && <p className="text-white text-[10px] md:text-sm font-semibold truncate">{post.title}</p>}
                      <p className="text-gray-300 text-[8px] md:text-xs line-clamp-2">{post.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(selectedCategory === "all" || selectedCategory === "campaigns") && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-3 md:px-0">
              <h3 className="text-lg font-semibold text-[#D4AF37] font-italic italic">Featured Campaigns</h3>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#D4AF37]" onClick={() => setSelectedCategory("campaigns")}>
                View All
              </Button>
            </div>
            {campaignsLoading ? (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse bg-[#0A0A0A] rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {filteredCampaigns?.slice(0, 6).map((campaign: any) => (
                  <div 
                    key={campaign.id} 
                    className="aspect-square relative group overflow-hidden cursor-pointer bg-[#0A0A0A] border border-gray-900"
                    onClick={() => navigate(`/donate/${campaign.slug}`)}
                  >
                    {campaign.imageUrl || campaign.image ? (
                      <img 
                        src={campaign.imageUrl || campaign.image} 
                        alt={campaign.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <ImageIcon size={24} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 md:p-4">
                      <p className="text-white text-[10px] md:text-sm font-semibold truncate">{campaign.title}</p>
                      <p className="text-[#D4AF37] text-[8px] md:text-xs font-bold">${(campaign.currentAmount || 0).toLocaleString()} raised</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(selectedCategory === "all" || selectedCategory === "creators") && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-3 md:px-0">
              <h3 className="text-lg font-semibold text-[#D4AF37] font-italic italic">Popular Creators</h3>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#D4AF37]" onClick={() => setSelectedCategory("creators")}>
                View All
              </Button>
            </div>
            {creatorsLoading ? (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse bg-[#0A0A0A] rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {filteredCreators?.slice(0, 6).map((creator: any) => (
                  <div 
                    key={creator.id} 
                    className="aspect-square relative group overflow-hidden cursor-pointer bg-[#0A0A0A] border border-gray-900"
                    onClick={() => navigate(`/creators/${creator.id}`)}
                  >
                    {creator.profileImage ? (
                      <img 
                        src={getImageUrl(creator.profileImage)} 
                        alt={creator.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#111] text-[#D4AF37] font-bold text-xl">
                        {creator.name?.[0]}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 md:p-4">
                      <p className="text-white text-[10px] md:text-sm font-semibold truncate">{creator.name}</p>
                      <p className="text-gray-300 text-[8px] md:text-xs truncate">{creator.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(selectedCategory === "all" || selectedCategory === "businesses") && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-3 md:px-0">
              <h3 className="text-lg font-semibold text-[#D4AF37] font-italic italic">Featured Businesses</h3>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#D4AF37]" onClick={() => setSelectedCategory("businesses")}>
                View All
              </Button>
            </div>
            {businessesLoading ? (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse bg-[#0A0A0A] rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {filteredBusinesses?.slice(0, 6).map((business: any) => (
                  <div 
                    key={business.id} 
                    className="aspect-square relative group overflow-hidden cursor-pointer bg-[#0A0A0A] border border-gray-900"
                    onClick={() => navigate(`/business/profile/${business.id}`)}
                  >
                    {business.logo ? (
                      <img 
                        src={getImageUrl(business.logo)} 
                        alt={business.companyName}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#111] text-[#D4AF37] font-bold text-xl">
                        {business.companyName?.[0]}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 md:p-4">
                      <p className="text-white text-[10px] md:text-sm font-semibold truncate">{business.companyName}</p>
                      <p className="text-[#D4AF37] text-[8px] md:text-xs font-bold">{business.industry}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(selectedCategory === "all" || selectedCategory === "ministries") && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-3 md:px-0">
              <h3 className="text-lg font-semibold text-[#D4AF37] font-italic italic">Featured Ministries</h3>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#D4AF37]" onClick={() => setSelectedCategory("ministries")}>
                View All
              </Button>
            </div>
            {ministriesLoading ? (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse bg-[#0A0A0A] rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {filteredMinistries?.slice(0, 6).map((ministry: any) => (
                  <div 
                    key={ministry.id} 
                    className="aspect-square relative group overflow-hidden cursor-pointer bg-[#0A0A0A] border border-gray-900"
                    onClick={() => navigate(`/ministry/${ministry.id}`)}
                  >
                    {ministry.logo ? (
                      <img 
                        src={getImageUrl(ministry.logo)} 
                        alt={ministry.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#111] text-[#D4AF37] font-bold text-xl">
                        {ministry.name?.[0]}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 md:p-4">
                      <p className="text-white text-[10px] md:text-sm font-semibold truncate">{ministry.name}</p>
                      <p className="text-[#D4AF37] text-[8px] md:text-xs font-bold">{ministry.denomination}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(selectedCategory === "all" || selectedCategory === "users") && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-3 md:px-0">
              <h3 className="text-lg font-semibold text-[#D4AF37] font-italic italic">Suggested for You</h3>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#D4AF37]" onClick={() => setSelectedCategory("users")}>
                View All
              </Button>
            </div>
            {usersLoading ? (
              <div className="space-y-3 px-3 md:px-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-3 p-4 bg-[#0A0A0A] border border-gray-900 rounded-lg">
                    <div className="h-12 w-12 bg-gray-900 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-900 rounded mb-2 w-1/3"></div>
                      <div className="h-3 bg-gray-900 rounded w-1/4"></div>
                    </div>
                    <div className="h-8 w-20 bg-gray-900 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 px-3 md:px-0">
                {randomizedUsers?.slice(0, 9).map((member: any) => (
                  <div key={member.id} className="flex items-center space-x-3 p-4 bg-[#0A0A0A] border border-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
                    <div className="cursor-pointer" onClick={() => navigate(`/profile/${member.username}`)}>
                      <Avatar className="h-12 w-12 border border-gray-800">
                        <AvatarImage src={getImageUrl(member.profileImageUrl)} />
                        <AvatarFallback className="bg-gray-900 text-gray-400">{member.firstName?.[0] || member.username?.[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${member.username}`)}>
                      <h4 className="font-medium text-white">
                        {member.firstName && member.lastName 
                          ? `${member.firstName} ${member.lastName}`
                          : member.username}
                      </h4>
                      <p className="text-xs text-gray-400">@{member.username}</p>
                    </div>
                    <button
                      className="border border-[#D4AF37] text-[#D4AF37] bg-transparent rounded-full px-4 py-1.5 text-sm font-medium hover:bg-[#D4AF37] hover:text-black transition-colors"
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
