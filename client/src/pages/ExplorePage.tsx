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
import { getUserDisplayName, getUserInitials } from "@/lib/user-display";

function PostPreviewCard({ post, navigate }: { post: any; navigate: (path: string) => void }) {
  return (
    <div 
      className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-800 transition-colors w-full shadow-sm"
      onClick={() => navigate(`/post/${post.id}`)}
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="w-9 h-9">
          <AvatarImage src={getImageUrl(post.user?.profileImageUrl)} />
          <AvatarFallback className="bg-[#D4AF37] text-black text-xs">
            {getUserInitials(post.user)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {getUserDisplayName(post.user)}
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

function ProfileCard({ item, navigate }: { item: { type: string; data: any }; navigate: (path: string) => void }) {
  const getRoute = () => {
    switch (item.type) {
      case 'creator': return `/creators/${item.data.id}`;
      case 'business': return `/business/profile/${item.data.id}`;
      case 'ministry': return `/ministry/${item.data.id}`;
      case 'user': return `/profile/${item.data.username}`;
      default: return '/explore';
    }
  };

  const getImage = () => {
    switch (item.type) {
      case 'creator': return getImageUrl(item.data.profileImage);
      case 'business': return getImageUrl(item.data.logo);
      case 'ministry': return getImageUrl(item.data.logo);
      case 'user': return getImageUrl(item.data.profileImageUrl);
      default: return '';
    }
  };

  const getName = () => {
    switch (item.type) {
      case 'creator': return item.data.name;
      case 'business': return item.data.companyName;
      case 'ministry': return item.data.name;
      case 'user': return item.data.displayName
        ? item.data.displayName
        : item.data.firstName && item.data.lastName 
          ? `${item.data.firstName} ${item.data.lastName}` 
          : item.data.username;
      default: return '';
    }
  };

  const getSubtext = () => {
    switch (item.type) {
      case 'creator': return item.data.content || 'Creator';
      case 'business': return item.data.industry || 'Business';
      case 'ministry': return item.data.denomination || 'Ministry';
      case 'user': return `@${item.data.username}`;
      default: return '';
    }
  };

  const getBadge = () => {
    switch (item.type) {
      case 'creator': return { label: 'Creator', color: 'bg-[#D4AF37]/20 text-[#D4AF37]' };
      case 'business': return { label: 'Business', color: 'bg-[#D4AF37]/20 text-[#D4AF37]' };
      case 'ministry': return { label: 'Ministry', color: 'bg-purple-500/20 text-purple-400' };
      case 'user': return { label: 'Member', color: 'bg-gray-700/50 text-gray-300' };
      default: return { label: '', color: '' };
    }
  };

  const badge = getBadge();
  const initials = getName()?.[0] || '?';

  return (
    <div 
      className="bg-gray-900 border border-gray-800 rounded-xl p-3 cursor-pointer hover:bg-gray-800 transition-colors flex flex-col items-center text-center shadow-sm"
      onClick={() => navigate(getRoute())}
    >
      <Avatar className="w-14 h-14 mb-2 border-2 border-gray-700">
        <AvatarImage src={getImage()} />
        <AvatarFallback className="bg-gray-800 text-[#D4AF37] font-bold text-lg">
          {initials}
        </AvatarFallback>
      </Avatar>
      <p className="text-white text-xs font-semibold truncate w-full">{getName()}</p>
      <p className="text-gray-500 text-[10px] truncate w-full mb-2">{getSubtext()}</p>
      <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
        {badge.label}
      </span>
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

  const allFilteredPosts = posts && Array.isArray(posts) ? posts.filter((post: any) => {
    const matchesSearch = !searchTerm || 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) : [];

  const discoveryPosts = allFilteredPosts.filter((post: any) => {
    return post.userId !== user?.id && !followingIds.includes(post.userId);
  });

  const filteredPosts = discoveryPosts.length > 0 ? discoveryPosts : allFilteredPosts;

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

  const allProfiles = [
    ...filteredCreators.map((c: any) => ({ type: 'creator', data: c, date: new Date(c.createdAt || '2025-01-01') })),
    ...filteredBusinesses.map((b: any) => ({ type: 'business', data: b, date: new Date(b.createdAt || '2025-01-01') })),
    ...filteredMinistries.map((m: any) => ({ type: 'ministry', data: m, date: new Date(m.createdAt || '2025-01-01') })),
    ...((() => {
      const shuffled = [...filteredUsers];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const unfollowed = shuffled.filter((u: any) => !followingIds.includes(u.id));
      const followed = shuffled.filter((u: any) => followingIds.includes(u.id));
      return [...unfollowed, ...followed].slice(0, 6);
    })().map((u: any) => ({ type: 'user', data: u, date: new Date(u.createdAt || '2025-01-01') }))),
  ];

  const sortedPosts = [...filteredPosts].sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const showPosts = selectedCategory === 'all' || selectedCategory === 'posts';
  const showProfiles = selectedCategory === 'all' || ['creators', 'businesses', 'ministries', 'users'].includes(selectedCategory);

  const getFilteredProfiles = () => {
    if (selectedCategory === 'all') return allProfiles;
    if (selectedCategory === 'creators') return allProfiles.filter(p => p.type === 'creator');
    if (selectedCategory === 'businesses') return allProfiles.filter(p => p.type === 'business');
    if (selectedCategory === 'ministries') return allProfiles.filter(p => p.type === 'ministry');
    if (selectedCategory === 'users') return allProfiles.filter(p => p.type === 'user');
    return [];
  };

  const displayProfiles = getFilteredProfiles();

  const buildFeed = () => {
    const feed: { type: 'post' | 'profiles'; data: any }[] = [];
    const profileChunkSize = 3;
    const profilesToInsert = showProfiles ? displayProfiles : [];
    const profileChunks: any[][] = [];
    for (let i = 0; i < profilesToInsert.length; i += profileChunkSize) {
      profileChunks.push(profilesToInsert.slice(i, i + profileChunkSize));
    }

    if (showPosts && sortedPosts.length > 0) {
      let chunkIndex = 0;

      sortedPosts.forEach((post: any, i: number) => {
        feed.push({ type: 'post', data: post });

        if (chunkIndex < profileChunks.length && (i + 1) % 2 === 0) {
          feed.push({ type: 'profiles', data: profileChunks[chunkIndex] });
          chunkIndex++;
        }
      });

      while (chunkIndex < profileChunks.length) {
        feed.push({ type: 'profiles', data: profileChunks[chunkIndex] });
        chunkIndex++;
      }
    } else if (showProfiles && !showPosts) {
      profileChunks.forEach((chunk) => {
        feed.push({ type: 'profiles', data: chunk });
      });
    } else if (showPosts) {
      sortedPosts.forEach((post: any) => {
        feed.push({ type: 'post', data: post });
      });
    }

    return feed;
  };

  const feed = buildFeed();

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
              className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-[#D4AF37]"
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
          {feed.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-sm">Try a different search or category</p>
              </div>
            </div>
          ) : (
            feed.map((item, index) => {
              if (item.type === 'post') {
                return <PostPreviewCard key={`post-${item.data.id}`} post={item.data} navigate={navigate} />;
              } else {
                return (
                  <div key={`profiles-${index}`} className="grid grid-cols-3 gap-2">
                    {item.data.map((profile: any, i: number) => (
                      <ProfileCard 
                        key={`${profile.type}-${profile.data.id || i}`} 
                        item={profile} 
                        navigate={navigate} 
                      />
                    ))}
                  </div>
                );
              }
            })
          )}
        </div>
      </div>
    </div>
  );
}
