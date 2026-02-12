import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, TrendingUp, Users, Star, Check, Heart, MessageCircle, Share2, Briefcase, Church, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/platform";
import { getImageUrl } from "@/lib/api-config";

type FeedItem = {
  type: 'post' | 'creator' | 'business' | 'ministry' | 'user';
  id: string;
  data: any;
  sortDate: Date;
};

function PostPreviewCard({ post, navigate }: { post: any; navigate: (path: string) => void }) {
  return (
    <div 
      className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-4 cursor-pointer hover:bg-[#111] transition-colors"
      onClick={() => navigate(`/post/${post.id}`)}
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="w-9 h-9">
          <AvatarImage src={getImageUrl(post.user?.profileImageUrl)} />
          <AvatarFallback className="bg-[#D4AF37] text-black text-xs">
            {post.user?.firstName?.[0] || post.user?.username?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {post.user?.firstName && post.user?.lastName 
              ? `${post.user.firstName} ${post.user.lastName}`
              : post.user?.username || 'User'}
          </p>
          <p className="text-gray-500 text-xs">@{post.user?.username || 'user'}</p>
        </div>
        <span className="text-gray-600 text-xs">{new Date(post.createdAt).toLocaleDateString()}</span>
      </div>

      {post.title && (
        <h3 className="text-white font-semibold text-sm mb-1">{post.title}</h3>
      )}
      
      <p className="text-gray-300 text-sm leading-relaxed line-clamp-3 mb-3">{post.content}</p>

      {post.mediaUrls?.[0] && (
        <div className="rounded-lg overflow-hidden mb-3">
          {post.mediaType === 'video' || (typeof post.mediaUrls[0] === 'string' && (post.mediaUrls[0].toLowerCase().endsWith('.mp4') || post.mediaUrls[0].toLowerCase().endsWith('.mov') || post.mediaUrls[0].toLowerCase().endsWith('.webm'))) ? (
            <video 
              src={getImageUrl(post.mediaUrls[0])} 
              className="w-full max-h-[300px] object-cover rounded-lg"
              muted
              playsInline
              loop
              onMouseOver={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
              onMouseOut={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
            />
          ) : (
            <img 
              src={getImageUrl(post.mediaUrls[0])} 
              alt={post.title || "Post"}
              className="w-full max-h-[300px] object-cover rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>
      )}

      <div className="flex items-center gap-4 text-gray-500 text-xs">
        <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likesCount || 0}</span>
        <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {post.commentsCount || 0}</span>
        <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> {post.sharesCount || 0}</span>
      </div>
    </div>
  );
}

function CreatorCard({ creator, navigate }: { creator: any; navigate: (path: string) => void }) {
  return (
    <div 
      className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-4 cursor-pointer hover:bg-[#111] transition-colors"
      onClick={() => navigate(`/creators/${creator.id}`)}
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 border-2 border-[#D4AF37]">
          <AvatarImage src={getImageUrl(creator.profileImage)} />
          <AvatarFallback className="bg-[#D4AF37] text-black font-bold">
            {creator.name?.[0] || 'C'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-semibold text-sm truncate">{creator.name}</p>
            <span className="bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] px-2 py-0.5 rounded-full font-medium">Creator</span>
          </div>
          <p className="text-gray-500 text-xs">{creator.content || 'Content Creator'}</p>
        </div>
        <Button
          size="sm"
          className="bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black rounded-full text-xs px-4 h-8"
        >
          View
        </Button>
      </div>
      {creator.bio && (
        <p className="text-gray-400 text-xs mt-3 line-clamp-2 leading-relaxed">{creator.bio}</p>
      )}
    </div>
  );
}

function BusinessCard({ business, navigate }: { business: any; navigate: (path: string) => void }) {
  return (
    <div 
      className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-4 cursor-pointer hover:bg-[#111] transition-colors"
      onClick={() => navigate(`/business/profile/${business.id}`)}
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 border-2 border-gray-700">
          <AvatarImage src={getImageUrl(business.logo)} />
          <AvatarFallback className="bg-gray-800 text-[#D4AF37] font-bold">
            {business.companyName?.[0] || 'B'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-semibold text-sm truncate">{business.companyName}</p>
            <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Briefcase className="w-2.5 h-2.5" /> Business
            </span>
          </div>
          <p className="text-[#D4AF37] text-xs">{business.industry || 'Business'}</p>
        </div>
        <Button
          size="sm"
          className="bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black rounded-full text-xs px-4 h-8"
        >
          View
        </Button>
      </div>
      {business.description && (
        <p className="text-gray-400 text-xs mt-3 line-clamp-2 leading-relaxed">{business.description}</p>
      )}
    </div>
  );
}

function MinistryCard({ ministry, navigate }: { ministry: any; navigate: (path: string) => void }) {
  return (
    <div 
      className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-4 cursor-pointer hover:bg-[#111] transition-colors"
      onClick={() => navigate(`/ministry/${ministry.id}`)}
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 border-2 border-gray-700">
          <AvatarImage src={getImageUrl(ministry.logo)} />
          <AvatarFallback className="bg-gray-800 text-[#D4AF37] font-bold">
            {ministry.name?.[0] || 'M'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-semibold text-sm truncate">{ministry.name}</p>
            <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Church className="w-2.5 h-2.5" /> Ministry
            </span>
          </div>
          <p className="text-[#D4AF37] text-xs">{ministry.denomination || 'Ministry'}</p>
        </div>
        <Button
          size="sm"
          className="bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black rounded-full text-xs px-4 h-8"
        >
          View
        </Button>
      </div>
      {ministry.description && (
        <p className="text-gray-400 text-xs mt-3 line-clamp-2 leading-relaxed">{ministry.description}</p>
      )}
    </div>
  );
}

function UserCard({ member, navigate }: { member: any; navigate: (path: string) => void }) {
  return (
    <div 
      className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-4 cursor-pointer hover:bg-[#111] transition-colors"
      onClick={() => navigate(`/profile/${member.username}`)}
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 border border-gray-700">
          <AvatarImage src={getImageUrl(member.profileImageUrl)} />
          <AvatarFallback className="bg-gray-800 text-gray-400">
            {member.firstName?.[0] || member.username?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {member.firstName && member.lastName 
              ? `${member.firstName} ${member.lastName}`
              : member.username}
          </p>
          <p className="text-gray-500 text-xs">@{member.username}</p>
        </div>
        <Button
          size="sm"
          className="bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black rounded-full text-xs px-4 h-8"
        >
          <UserPlus className="w-3 h-3 mr-1" /> Follow
        </Button>
      </div>
      {member.bio && (
        <p className="text-gray-400 text-xs mt-2 line-clamp-2 leading-relaxed">{member.bio}</p>
      )}
    </div>
  );
}

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

  const { data: creators } = useQuery({
    queryKey: ["/api/content-creators"],
    enabled: !!user,
  });

  const { data: businesses } = useQuery({
    queryKey: ["/api/business-profiles"],
    enabled: !!user,
  });

  const { data: ministries } = useQuery({
    queryKey: ["/api/ministries"],
    enabled: !!user,
  });

  const { data: allUsers } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  const { data: posts } = useQuery({
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
    { id: "creators", label: "Creators", icon: Star },
    { id: "businesses", label: "Businesses", icon: Briefcase },
    { id: "ministries", label: "Ministries", icon: Church },
    { id: "users", label: "Members", icon: Users },
  ];

  const followingIds = userFollowing && Array.isArray(userFollowing) ? userFollowing.map((f: any) => f.id) : [];

  const filteredPosts = posts && Array.isArray(posts) ? posts.filter((post: any) => {
    if (post.userId === user?.id) return false;
    if (followingIds.includes(post.userId)) return false;
    const matchesSearch = !searchTerm || 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) : [];

  const filteredCreators = creators && Array.isArray(creators) ? creators.filter((creator: any) => {
    const matchesSearch = !searchTerm ||
      creator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.content?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) : [];

  const filteredBusinesses = businesses && Array.isArray(businesses) ? businesses.filter((business: any) => {
    const matchesSearch = !searchTerm ||
      business.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) : [];

  const filteredMinistries = ministries && Array.isArray(ministries) ? ministries.filter((ministry: any) => {
    const matchesSearch = !searchTerm ||
      ministry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ministry.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) : [];

  const filteredUsers = allUsers && Array.isArray(allUsers) ? allUsers.filter((targetUser: any) => {
    if (targetUser.id === user?.id) return false;
    
    const hasMinistryProfile = ministries && Array.isArray(ministries) && ministries.some((m: any) => m.userId === targetUser.id);
    const hasCreatorProfile = creators && Array.isArray(creators) && creators.some((c: any) => c.userId === targetUser.id);
    const hasBusinessProfile = businesses && Array.isArray(businesses) && businesses.some((b: any) => b.userId === targetUser.id);
    
    const isRegularUser = !hasMinistryProfile && !hasCreatorProfile && !hasBusinessProfile;
    
    const matchesSearch = !searchTerm ||
      targetUser.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      targetUser.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      targetUser.username?.toLowerCase().includes(searchTerm.toLowerCase());
      
    return isRegularUser && matchesSearch;
  }) : [];

  const buildMixedFeed = (): FeedItem[] => {
    const items: FeedItem[] = [];

    if (selectedCategory === 'all' || selectedCategory === 'posts') {
      filteredPosts.forEach((post: any) => {
        items.push({
          type: 'post',
          id: `post-${post.id}`,
          data: post,
          sortDate: new Date(post.createdAt),
        });
      });
    }

    if (selectedCategory === 'all' || selectedCategory === 'creators') {
      filteredCreators.forEach((creator: any) => {
        items.push({
          type: 'creator',
          id: `creator-${creator.id}`,
          data: creator,
          sortDate: new Date(creator.createdAt || '2025-01-01'),
        });
      });
    }

    if (selectedCategory === 'all' || selectedCategory === 'businesses') {
      filteredBusinesses.forEach((business: any) => {
        items.push({
          type: 'business',
          id: `business-${business.id}`,
          data: business,
          sortDate: new Date(business.createdAt || '2025-01-01'),
        });
      });
    }

    if (selectedCategory === 'all' || selectedCategory === 'ministries') {
      filteredMinistries.forEach((ministry: any) => {
        items.push({
          type: 'ministry',
          id: `ministry-${ministry.id}`,
          data: ministry,
          sortDate: new Date(ministry.createdAt || '2025-01-01'),
        });
      });
    }

    if (selectedCategory === 'all' || selectedCategory === 'users') {
      const shuffled = [...filteredUsers];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const unfollowed = shuffled.filter((u: any) => !followingIds.includes(u.id));
      const followed = shuffled.filter((u: any) => followingIds.includes(u.id));
      [...unfollowed, ...followed].slice(0, 10).forEach((member: any) => {
        items.push({
          type: 'user',
          id: `user-${member.id}`,
          data: member,
          sortDate: new Date(member.createdAt || '2025-01-01'),
        });
      });
    }

    if (selectedCategory === 'all') {
      items.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
    }

    return items;
  };

  const feedItems = buildMixedFeed();

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="bg-black border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 max-w-lg">
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

      <div className="container mx-auto px-4 py-4 max-w-lg">
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
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

        <div className="space-y-3">
          {feedItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-sm">Try a different search or category</p>
              </div>
            </div>
          ) : (
            feedItems.map((item) => {
              switch (item.type) {
                case 'post':
                  return <PostPreviewCard key={item.id} post={item.data} navigate={navigate} />;
                case 'creator':
                  return <CreatorCard key={item.id} creator={item.data} navigate={navigate} />;
                case 'business':
                  return <BusinessCard key={item.id} business={item.data} navigate={navigate} />;
                case 'ministry':
                  return <MinistryCard key={item.id} ministry={item.data} navigate={navigate} />;
                case 'user':
                  return <UserCard key={item.id} member={item.data} navigate={navigate} />;
                default:
                  return null;
              }
            })
          )}
        </div>
      </div>
    </div>
  );
}
