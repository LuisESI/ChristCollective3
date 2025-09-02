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

const createQueueSchema = insertGroupChatQueueSchema.extend({
  minPeople: z.coerce.number().min(2, "Minimum 2 people").max(12, "Maximum 12 people"),
  maxPeople: z.coerce.number().min(4, "Minimum 4 people").max(12, "Maximum 12 people"),
});

type CreateQueueForm = z.infer<typeof createQueueSchema>;

const intentionOptions = [
  { value: "prayer", label: "Prayer", icon: Heart, color: "bg-red-500" },
  { value: "bible_study", label: "Bible Study", icon: BookOpen, color: "bg-blue-500" },
  { value: "evangelizing", label: "Evangelizing", icon: MessageCircle, color: "bg-green-500" },
  { value: "fellowship", label: "Fellowship", icon: Users, color: "bg-purple-500" },
  { value: "worship", label: "Worship", icon: Calendar, color: "bg-[#D4AF37]" },
];

export default function ConnectPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [joinedQueues, setJoinedQueues] = useState<Set<number>>(new Set());

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
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-gray-400">You need to be signed in to access the Connect page.</p>
        </div>
      </div>
    );
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
              <div className="space-y-4">
                {queues.map((queue) => {
                  const intentionInfo = getIntentionInfo(queue.intention);
                  const Icon = intentionInfo.icon;
                  const isOwner = queue.creatorId === user.id;
                  const progressPercent = (queue.currentCount / queue.maxPeople) * 100;
                  // Check if user is already a member of this queue
                  const isMember = joinedQueues.has(queue.id);
                  const createdDate = new Date().toLocaleDateString(); // Since we don't have createdAt, using current date
                  
                  return (
                    <div key={queue.id} className="rounded-xl bg-black border border-gray-700/50 hover:border-[#D4AF37]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/20 w-full">
                      <div className="p-4 flex items-center space-x-4">
                        {/* Left Section - Icon */}
                        <div className={`p-2.5 rounded-lg ${intentionInfo.color} flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        
                        {/* Middle Section - Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate mb-1">{queue.title}</h3>
                          <Badge className={`${intentionInfo.color} text-white text-xs px-2 py-0.5 font-medium mb-1 inline-block`}>
                            {intentionInfo.label}
                          </Badge>
                          <div className="text-xs text-gray-400 mb-0.5">
                            {createdDate}
                          </div>
                          <div className="text-xs text-gray-400">
                            {queue.currentCount}/{queue.maxPeople} members
                          </div>
                        </div>
                        
                        {/* Right Section - Member Avatars and Action Button */}
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          <div className="flex -space-x-1.5">
                            {Array.from({ length: Math.min(queue.currentCount, 3) }).map((_, index) => (
                              <div key={index} className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-black flex items-center justify-center">
                                <span className="text-xs text-white font-medium">
                                  {String.fromCharCode(65 + index)}
                                </span>
                              </div>
                            ))}
                            {queue.currentCount > 3 && (
                              <div className="w-7 h-7 rounded-full bg-gray-600 border-2 border-black flex items-center justify-center">
                                <span className="text-xs text-white font-medium">+{queue.currentCount - 3}</span>
                              </div>
                            )}
                          </div>
                          
                          {isOwner ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelQueueMutation.mutate(queue.id)}
                              disabled={cancelQueueMutation.isPending}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/30 border border-red-500/30 hover:border-red-400/50 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-300"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          ) : isMember ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => exitQueueMutation.mutate(queue.id)}
                              disabled={exitQueueMutation.isPending}
                              className="text-orange-400 hover:text-orange-300 hover:bg-orange-900/30 border border-orange-500/30 hover:border-orange-400/50 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-300"
                            >
                              {exitQueueMutation.isPending ? (
                                <div className="w-3 h-3 border-2 border-orange-300/30 border-t-orange-300 rounded-full animate-spin" />
                              ) : (
                                <>
                                  <X className="w-3 h-3 mr-1" />
                                  Exit
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => joinQueueMutation.mutate(queue.id)}
                              disabled={joinQueueMutation.isPending || queue.currentCount >= queue.maxPeople}
                              className="bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 font-medium px-3 py-1.5 text-xs shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                              size="sm"
                            >
                              {joinQueueMutation.isPending ? (
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : queue.currentCount >= queue.maxPeople ? (
                                "Full"
                              ) : (
                                <>
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  Join
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    className="rounded-xl bg-black border border-gray-700/50 hover:border-[#D4AF37]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/20 cursor-pointer w-full"
                    onClick={() => navigate(`/chat/${chat.id}`)}
                  >
                    <div className="p-4 flex items-center space-x-4">
                      {/* Left Section - Icon */}
                      <div className={`p-2.5 rounded-lg ${intentionInfo.color} flex-shrink-0 relative`}>
                        <Icon className="w-5 h-5 text-white" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black"></div>
                      </div>
                      
                      {/* Middle Section - Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate mb-1">{chat.title}</h3>
                        <Badge className={`${intentionInfo.color} text-white text-xs px-2 py-0.5 font-medium mb-1 inline-block`}>
                          {intentionInfo.label}
                        </Badge>
                        <div className="text-xs text-gray-400 mb-0.5">
                          Started {startDate}
                        </div>
                        <div className="text-xs text-gray-400">
                          {chat.memberCount} members
                        </div>
                      </div>
                      
                      {/* Right Section - Member Avatars and Button */}
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <div className="flex -space-x-1.5">
                          {Array.from({ length: Math.min(chat.memberCount, 3) }).map((_, index) => (
                            <div key={index} className="w-7 h-7 rounded-full bg-gradient-to-r from-green-500 to-blue-500 border-2 border-black flex items-center justify-center">
                              <span className="text-xs text-white font-medium">
                                {String.fromCharCode(65 + index)}
                              </span>
                            </div>
                          ))}
                          {chat.memberCount > 3 && (
                            <div className="w-7 h-7 rounded-full bg-gray-600 border-2 border-black flex items-center justify-center">
                              <span className="text-xs text-white font-medium">+{chat.memberCount - 3}</span>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chat/${chat.id}`);
                          }}
                          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 font-medium px-3 py-1.5 text-xs shadow-md hover:shadow-lg transition-all duration-300 rounded-md"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Open
                        </Button>
                      </div>
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