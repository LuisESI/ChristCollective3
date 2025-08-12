import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    onSuccess: () => {
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

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Active Chats</h1>
            <p className="text-gray-400 mt-1">Join ongoing conversations with fellow believers</p>
          </div>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium px-6 py-2"
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
                          <Textarea 
                            {...field} 
                            value={field.value || ""}
                            placeholder="Share what your group will discuss, pray about, or study together..."
                            className="bg-black/50 border border-gray-600 text-white placeholder-gray-500 rounded-lg resize-none transition-all duration-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:bg-black/70"
                            rows={3}
                          />
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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Chat Queues</h2>
                <p className="text-sm text-gray-400">Available queues waiting for people to join</p>
              </div>
              {queues.length > 0 && (
                <Badge variant="outline" className="bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]">
                  {queues.length} Available
                </Badge>
              )}
            </div>
            
            {queues.length > 0 ? (
              <div className="space-y-3">
                {queues.map((queue) => {
                  const intentionInfo = getIntentionInfo(queue.intention);
                  const Icon = intentionInfo.icon;
                  const isOwner = queue.creatorId === user.id;
                  const progressPercent = (queue.currentCount / queue.maxPeople) * 100;
                  
                  return (
                    <Card key={queue.id} className="bg-black border border-gray-700/50 hover:border-[#D4AF37]/30 transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-xl ${intentionInfo.color} shadow-lg`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-lg font-bold text-white">{queue.title}</h3>
                                <Badge className={`${intentionInfo.color} text-white text-xs border-none`}>
                                  {intentionInfo.label}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <div className="flex items-center space-x-1">
                                  <Users className="w-4 h-4" />
                                  <span>{queue.currentCount}</span>
                                  <span className="text-gray-600">members</span>
                                  <span className="text-gray-600">•</span>
                                  <span>active</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>Started {formatTimeAgo(queue.createdAt!)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {!isOwner ? (
                              <Button
                                onClick={() => joinQueueMutation.mutate(queue.id)}
                                disabled={joinQueueMutation.isPending || queue.currentCount >= queue.maxPeople}
                                className="bg-green-600 text-white hover:bg-green-700 font-semibold px-6 py-2 shadow-lg transition-all duration-300 disabled:opacity-50"
                              >
                                {joinQueueMutation.isPending ? (
                                  <div className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    Joining...
                                  </div>
                                ) : queue.currentCount >= queue.maxPeople ? (
                                  "Queue Full"
                                ) : (
                                  <>
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Join
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelQueueMutation.mutate(queue.id)}
                                disabled={cancelQueueMutation.isPending}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-black border border-gray-700/50 rounded-lg">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-[#D4AF37]/20 rounded-full">
                    <Users className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No active queues</h3>
                <p className="text-gray-400 text-sm">Start a queue to connect with other believers</p>
              </div>
            )}
          </div>
        )}

        {/* Active Chats Section - Bottom */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Chats & Chat Queues</h2>
              <p className="text-sm text-gray-400">Your joined chats and queues</p>
            </div>
            {activeChats.length > 0 && (
              <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400">
                {activeChats.length} Active
              </Badge>
            )}
          </div>
          
          {activeChats.length > 0 ? (
            <div className="space-y-3">
              {activeChats.map((chat) => {
                const intentionInfo = getIntentionInfo(chat.intention);
                const Icon = intentionInfo.icon;
                
                return (
                  <Card key={chat.id} className="bg-black border border-gray-700/50 hover:border-[#D4AF37]/30 transition-all duration-300 relative overflow-hidden">
                    {/* Live indicator */}
                    <div className="absolute top-4 right-4 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-green-400 font-medium">LIVE</span>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl ${intentionInfo.color} shadow-lg relative`}>
                            <Icon className="w-5 h-5 text-white" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-lg font-bold text-white">{chat.title}</h3>
                              <Badge className={`${intentionInfo.color} text-white text-xs border-none`}>
                                {intentionInfo.label}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>{chat.memberCount}</span>
                                <span className="text-gray-600">members</span>
                                <span className="text-gray-600">•</span>
                                <span>active</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>Started {formatTimeAgo(chat.createdAt!)}</span>
                              </div>
                            </div>
                            
                            {/* Activity indicators */}
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                              <div className="flex items-center space-x-1">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                <span>Messages active</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                <span>Members online</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center space-y-2">
                          <Button
                            className="bg-green-600 text-white hover:bg-green-700 font-semibold px-6 py-2 shadow-lg transition-all duration-300"
                            onClick={() => {
                              // Navigate to chat room - placeholder for now
                              window.location.href = `/chat/${chat.id}`;
                            }}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Join
                          </Button>
                          <div className="text-center text-xs text-gray-500">
                            Free to join
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-black border border-gray-700/50 rounded-lg">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-green-500/20 rounded-full">
                  <MessageCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No active chats</h3>
              <p className="text-gray-400 text-sm">Join a queue to start chatting with other believers</p>
            </div>
          )}
        </div>


      </div>
    </div>
  );
}