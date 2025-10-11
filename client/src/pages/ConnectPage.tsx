import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Helmet } from "react-helmet";
import { 
  Users, 
  Plus, 
  Heart, 
  BookOpen, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  UserPlus,
  Clock,
  Calendar
} from "lucide-react";
import { insertGroupChatQueueSchema, type GroupChatQueue, type GroupChat } from "@shared/schema";
import AuthForm from "@/components/AuthForm";

const createQueueSchema = insertGroupChatQueueSchema.extend({
  minPeople: z.coerce.number().min(2, "Minimum 2 people").max(12, "Maximum 12 people"),
  maxPeople: z.coerce.number().min(4, "Minimum 4 people").max(12, "Maximum 12 people"),
});

type CreateQueueForm = z.infer<typeof createQueueSchema>;

const intentionOptions = [
  { value: "prayer", label: "Prayer", icon: Heart, color: "bg-red-500", badgeColor: "bg-red-500/20" },
  { value: "bible_study", label: "Bible Study", icon: BookOpen, color: "bg-blue-500", badgeColor: "bg-blue-500/20" },
  { value: "evangelizing", label: "Evangelizing", icon: MessageCircle, color: "bg-green-500", badgeColor: "bg-green-500/20" },
  { value: "fellowship", label: "Fellowship", icon: Users, color: "bg-purple-500", badgeColor: "bg-purple-500/20" },
  { value: "worship", label: "Worship", icon: Calendar, color: "bg-[#D4AF37]", badgeColor: "bg-[#D4AF37]/20" },
];

export default function ConnectPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [joinedQueues, setJoinedQueues] = useState<Set<number>>(new Set());
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const form = useForm<CreateQueueForm>({
    resolver: zodResolver(createQueueSchema),
    defaultValues: {
      title: "",
      description: "",
      intention: "prayer",
      minPeople: 4,
      maxPeople: 8,
    },
  });

  // Fetch active queues
  const { data: queues = [] } = useQuery<GroupChatQueue[]>({
    queryKey: ["/api/group-chat-queues"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch active chats
  const { data: activeChats = [] } = useQuery<GroupChat[]>({
    queryKey: ["/api/group-chats/active"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch direct chats
  const { data: directChats = [] } = useQuery<any[]>({
    queryKey: ["/api/direct-chats"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Create queue mutation
  const createQueueMutation = useMutation({
    mutationFn: async (data: CreateQueueForm) => {
      return apiRequest("/api/group-chat-queues", {
        method: "POST",
        data: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/group-chat-queues"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Queue created!",
        description: "People can now join your group chat queue.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create queue. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Join queue mutation
  const joinQueueMutation = useMutation({
    mutationFn: async (queueId: number) => {
      return apiRequest(`/api/group-chat-queues/${queueId}/join`, {
        method: "POST",
      });
    },
    onSuccess: (_, queueId) => {
      setJoinedQueues(prev => new Set(Array.from(prev).concat(queueId)));
      queryClient.invalidateQueries({ queryKey: ["/api/group-chat-queues"] });
      toast({
        title: "Joined queue!",
        description: "You'll be notified when the chat starts.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join queue. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel queue mutation
  const cancelQueueMutation = useMutation({
    mutationFn: async (queueId: number) => {
      return apiRequest(`/api/group-chat-queues/${queueId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/group-chat-queues"] });
      toast({
        title: "Queue cancelled",
        description: "Your queue has been cancelled.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel queue. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Exit queue mutation
  const exitQueueMutation = useMutation({
    mutationFn: async (queueId: number) => {
      return apiRequest(`/api/group-chat-queues/${queueId}/leave`, {
        method: "POST",
      });
    },
    onSuccess: (_, queueId) => {
      setJoinedQueues(prev => {
        const newSet = new Set(prev);
        newSet.delete(queueId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/group-chat-queues"] });
      toast({
        title: "Left queue",
        description: "You have left the queue.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to leave queue. Please try again.",
        variant: "destructive",
      });
    },
  });

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Check scroll position when queues change or component mounts
  useEffect(() => {
    checkScrollPosition();
  }, [queues]);

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

  const getIntentionInfo = (intention: string) => {
    return intentionOptions.find(opt => opt.value === intention) || intentionOptions[0];
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const created = typeof date === 'string' ? new Date(date) : date;
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>Connect - Christ Collective</title>
        <meta name="description" content="Join group chats for prayer, Bible study, evangelizing, and fellowship with other believers" />
      </Helmet>

      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Active Chats</h1>
            <p className="text-gray-400 text-sm mt-1">Join ongoing conversations with fellow believers</p>
          </div>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium px-4 py-2 text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Queue
          </Button>
        </div>

        {/* Create Queue Dialog */}
        <div className="hidden">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium">
                <Plus className="w-4 h-4 mr-2" />
                Start Chat Queue
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black text-white border border-[#D4AF37]/20 shadow-2xl max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-[#D4AF37]">
                      Create Group Chat Queue
                    </DialogTitle>
                    <p className="text-sm text-gray-400 mt-1">Bring believers together for meaningful connection</p>
                  </div>
                </div>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createQueueMutation.mutate(data))} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#D4AF37] font-medium text-sm">Queue Title</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., Evening Prayer Circle"
                            className="bg-black/50 border border-gray-600 text-white placeholder-gray-500 h-12 rounded-lg transition-all duration-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:bg-black/70"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#D4AF37] font-medium text-sm">Description (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Textarea 
                              {...field} 
                              value={field.value || ""}
                              placeholder="Share what your group will discuss, pray about, or study together..."
                              className="bg-black/50 border border-gray-600 text-white placeholder-gray-500 rounded-lg resize-none transition-all duration-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:bg-black/70"
                              rows={3}
                              maxLength={70}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= 70) {
                                  field.onChange(value);
                                }
                              }}
                            />
                            <div className="absolute bottom-2 right-3 text-xs text-gray-500">
                              {(field.value || "").length}/70
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="intention"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#D4AF37] font-medium text-sm">Purpose</FormLabel>
                        <div className="grid grid-cols-5 gap-3 mt-2">
                          {intentionOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = field.value === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => field.onChange(option.value)}
                                className={`
                                  flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 group hover:scale-105
                                  ${isSelected 
                                    ? `${option.color} border-white shadow-lg shadow-${option.color}/30` 
                                    : 'bg-black/30 border-gray-600 hover:border-gray-500 hover:bg-black/50'
                                  }
                                `}
                              >
                                <Icon className={`w-6 h-6 mb-2 transition-all duration-300 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                <span className={`text-xs font-medium transition-all duration-300 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                  {option.label}
                                </span>

                              </button>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
                    <h4 className="text-[#D4AF37] font-medium text-sm mb-4 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Group Size
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="minPeople"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 text-sm">Minimum People</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  type="number"
                                  min={4}
                                  max={12}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="bg-black/50 border border-gray-600 text-white h-12 rounded-lg transition-all duration-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 pl-4 pr-8"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                                  min
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxPeople"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 text-sm">Maximum People</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  type="number"
                                  min={4}
                                  max={12}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="bg-black/50 border border-gray-600 text-white h-12 rounded-lg transition-all duration-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 pl-4 pr-8"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                                  max
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs text-blue-300 flex items-center">
                        <MessageCircle className="w-3 h-3 mr-2" />
                        Chat starts automatically when minimum people join
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCreateDialogOpen(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-6 h-12"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createQueueMutation.isPending}
                      className="bg-[#D4AF37] text-black hover:bg-[#B8941F] font-semibold px-8 h-12 shadow-lg transition-all duration-300"
                    >
                      {createQueueMutation.isPending ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Queue
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Chat Queues Section - Top */}
        {(queues.length > 0 || activeChats.length === 0) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Chat Queues</h2>
                <p className="text-xs text-gray-400">Available queues waiting for people to join</p>
              </div>
              {queues.length > 0 && (
                <Badge variant="outline" className="bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]">
                  {queues.length} Available
                </Badge>
              )}
            </div>
            
            {queues.length > 0 ? (
              <div className="relative">
                {/* Navigation Arrows */}
                {canScrollLeft && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={scrollLeft}
                    className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-gray-900/80 border border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-white p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                )}
                {canScrollRight && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={scrollRight}
                    className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-gray-900/80 border border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-white p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Horizontal Scroll Container */}
                <div 
                  ref={scrollContainerRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {queues.map((queue) => {
                    const intentionInfo = getIntentionInfo(queue.intention);
                    const Icon = intentionInfo.icon;
                    const isOwner = queue.creatorId === user.id;
                    const progressPercent = (queue.currentCount / queue.maxPeople) * 100;
                    // Check if user is already a member of this queue
                    const isMember = joinedQueues.has(queue.id);
                    const createdDate = new Date().toLocaleDateString(); // Since we don't have createdAt, using current date
                    
                    return (
                      <div key={queue.id} className="rounded-lg bg-black border border-gray-700/50 hover:border-[#D4AF37]/50 transition-all duration-300 flex-shrink-0 w-80">
                        <div className="p-4">
                          {/* Top Row - Icon, Title and Badge */}
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`p-2 rounded-lg ${intentionInfo.color} flex-shrink-0`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex items-center space-x-2 flex-1">
                              <h3 className="text-sm font-semibold text-white">{queue.title}</h3>
                              <Badge className={`${intentionInfo.badgeColor} text-white text-xs px-2 py-0.5 font-medium`}>
                                {intentionInfo.label}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Date and Member Count */}
                          <div className="text-xs text-gray-400 mb-3 ml-11">
                            {createdDate} • {queue.currentCount}/{queue.maxPeople} members
                          </div>
                          
                          {/* Profile Pictures Row */}
                          <div className="flex space-x-2 ml-11 mb-4">
                            {queue.members?.slice(0, 5).map((member: any, index: number) => (
                              <div key={member.id} className="w-8 h-8 rounded-full border-2 border-gray-800 flex items-center justify-center overflow-hidden">
                                {member.profileImageUrl ? (
                                  <img 
                                    src={member.profileImageUrl} 
                                    alt={member.displayName || member.username || `User ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                    <span className="text-xs text-white font-medium">
                                      {(member.displayName || member.username || 'U').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )) || Array.from({ length: Math.min(queue.currentCount, 5) }).map((_, index) => (
                              <div key={index} className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-gray-800 flex items-center justify-center">
                                <span className="text-xs text-white font-medium">
                                  {String.fromCharCode(65 + index)}
                                </span>
                              </div>
                            ))}
                            {queue.currentCount > 5 && (
                              <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-gray-800 flex items-center justify-center">
                                <span className="text-xs text-white font-medium">+{queue.currentCount - 5}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Button - Full Width at Bottom */}
                          {isOwner ? (
                            <Button
                              variant="outline"
                              onClick={() => cancelQueueMutation.mutate(queue.id)}
                              disabled={cancelQueueMutation.isPending}
                              className="w-full text-red-400 border-red-400/50 hover:bg-red-400/10 py-2 text-sm rounded-lg"
                            >
                              Cancel Queue
                            </Button>
                          ) : isMember ? (
                            <Button
                              variant="outline"
                              onClick={() => exitQueueMutation.mutate(queue.id)}
                              disabled={exitQueueMutation.isPending}
                              className="w-full text-orange-400 border-orange-400/50 hover:bg-orange-400/10 py-2 text-sm rounded-lg"
                            >
                              {exitQueueMutation.isPending ? "Leaving Queue..." : "Exit Queue"}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => joinQueueMutation.mutate(queue.id)}
                              disabled={joinQueueMutation.isPending || queue.currentCount >= queue.maxPeople}
                              className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-medium py-2 text-sm rounded-lg"
                            >
                              {joinQueueMutation.isPending ? "Joining..." : queue.currentCount >= queue.maxPeople ? "Queue Full" : "Join Queue"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-black border border-gray-700/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 bg-[#D4AF37]/20 rounded-full">
                    <Users className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white mb-1">No active queues</h3>
                <p className="text-gray-400 text-xs">Start a queue to connect with other believers</p>
              </div>
            )}
          </div>
        )}

        {/* Active Chats Section - Bottom */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Chats</h2>
              <p className="text-xs text-gray-400">Your active group chats and direct messages</p>
            </div>
            {(activeChats.length > 0 || directChats.length > 0) && (
              <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400">
                {activeChats.length + directChats.length} Active
              </Badge>
            )}
          </div>
          
          {(activeChats.length > 0 || directChats.length > 0) ? (
            <div className="space-y-3">
              {/* Direct Chats */}
              {directChats.map((chat: any) => {
                const otherUser = chat.otherUser;
                const otherUserName = otherUser?.displayName || otherUser?.firstName || otherUser?.username || "User";
                const lastMessage = chat.lastMessage;
                
                return (
                  <Card 
                    key={`direct-${chat.id}`} 
                    className="bg-black border border-gray-700/50 hover:border-[#D4AF37]/30 transition-all duration-300 cursor-pointer hover:bg-gray-900/50"
                    onClick={() => navigate(`/direct-chat/${chat.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center">
                            {otherUser?.profileImageUrl ? (
                              <img 
                                src={otherUser.profileImageUrl} 
                                alt={otherUserName}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <span className="text-white text-sm font-bold">
                                {otherUserName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full"></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-base font-bold text-white truncate">{otherUserName}</h3>
                            <Badge className="bg-blue-500 text-white text-xs border-none flex-shrink-0">
                              Direct
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-gray-500 mb-1">
                            <span>@{otherUser?.username}</span>
                          </div>
                          
                          {lastMessage && (
                            <p className="text-xs text-gray-400 truncate">
                              {lastMessage.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* Group Chats */}
              {activeChats.map((chat) => {
                const intentionInfo = getIntentionInfo(chat.intention);
                const Icon = intentionInfo.icon;
                const startDate = new Date().toLocaleDateString(); // Since we don't have startedAt, using current date
                
                return (
                  <div 
                    key={`group-${chat.id}`} 
                    className="rounded-lg bg-black border border-gray-700/50 hover:border-[#D4AF37]/50 transition-all duration-300 cursor-pointer w-full"
                    onClick={() => navigate(`/chat/${chat.id}`)}
                  >
                    <div className="p-4">
                      {/* Top Row - Icon, Title and Badge */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg ${intentionInfo.color} flex-shrink-0 relative`}>
                          <Icon className="w-5 h-5 text-white" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black"></div>
                        </div>
                        <div className="flex items-center space-x-2 flex-1">
                          <h3 className="text-sm font-semibold text-white">{chat.title}</h3>
                          <Badge className={`${intentionInfo.badgeColor} text-white text-xs px-2 py-0.5 font-medium`}>
                            {intentionInfo.label}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Date and Member Count */}
                      <div className="text-xs text-gray-400 mb-3 ml-11">
                        Started {startDate} • {chat.memberCount} members
                      </div>
                      
                      {/* Profile Pictures Row */}
                      <div className="flex space-x-2 ml-11 mb-4">
                        {chat.members?.slice(0, 5).map((member, index) => (
                          <div key={member.id} className="w-8 h-8 rounded-full border-2 border-gray-800 flex items-center justify-center overflow-hidden">
                            {member.profileImageUrl ? (
                              <img 
                                src={member.profileImageUrl} 
                                alt={member.displayName || member.username || `User ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                                <span className="text-xs text-white font-medium">
                                  {(member.displayName || member.username || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        )) || Array.from({ length: Math.min(chat.memberCount, 5) }).map((_, index) => (
                          <div key={index} className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 border-2 border-gray-800 flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              {String.fromCharCode(65 + index)}
                            </span>
                          </div>
                        ))}
                        {chat.memberCount > 5 && (
                          <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-gray-800 flex items-center justify-center">
                            <span className="text-xs text-white font-medium">+{chat.memberCount - 5}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Open Chat Button - Full Width at Bottom */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/chat/${chat.id}`);
                        }}
                        className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-medium py-2 text-sm rounded-lg"
                      >
                        Open Chat
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 bg-black border border-gray-700/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">No active chats</h3>
              <p className="text-gray-400 text-xs">Join a queue or message someone to start chatting</p>
            </div>
          )}
        </div>


      </div>
    </div>
  );
}